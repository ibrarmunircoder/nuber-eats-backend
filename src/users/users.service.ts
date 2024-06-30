import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { UserVerification } from './entities/verification.entity';
import { VerifyEamilOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserVerification)
    private readonly userVerificationRepository: Repository<UserVerification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.userRepository.findOne({
        where: { email },
      });

      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }

      const user = await this.userRepository.save(
        this.userRepository.create({
          email,
          password,
          role,
        }),
      );
      const verification = await this.userVerificationRepository.save(
        this.userVerificationRepository.create({
          user,
        }),
      );
      await this.mailService.sendVerificationEmail(
        `Your email verification code is given below: ${verification.code}`,
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'password'],
      });
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }

      const token = this.jwtService.sign({ id: user.id });

      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Can't log user in.",
      };
    }
  }

  async editProfile(userId: number, editProfileInput: EditProfileInput) {
    try {
      const user = await this.findById(userId);

      if (editProfileInput.email) {
        user.verified = false;
        const verification = await this.userVerificationRepository.save(
          this.userVerificationRepository.create({
            user,
          }),
        );
        await this.mailService.sendVerificationEmail(
          `Your email verification code is given below: ${verification.code}`,
        );
      }

      Object.assign(user, editProfileInput);

      await this.userRepository.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: 'Could not update profile.' };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEamilOutput> {
    try {
      const verification = await this.userVerificationRepository.findOne({
        where: { code },
        relations: ['user'],
      });

      if (verification) {
        verification.user.verified = true;
        await this.userRepository.save(verification.user, {
          listeners: false,
        });
        await this.userVerificationRepository.remove(verification);
        return { ok: true };
      }

      return { ok: false, error: 'Verification not found' };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Could not verify email.' };
    }
  }

  async getUserProfile(userId: number): Promise<UserProfileOutput> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error();
      }
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return { ok: false, error: 'User Not Found' };
    }
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }
}
