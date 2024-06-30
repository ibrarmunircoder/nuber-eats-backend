import { Inject, Injectable } from '@nestjs/common';
import FormData from 'form-data';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async senEmail(subject: string, content: string) {
    const got = (await import('got')).default;
    const form = new FormData();
    form.append('from', `Ibrar Munir <mailgun@${this.options.domain}>`);
    form.append('to', 'plmavvokvmyzmacvoa@cazlp.com');
    form.append('text', content);
    form.append('subject', subject);
    await got.post(
      `https://api.mailgun.net/v3/${this.options.domain}/messages`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}`,
          ...form.getHeaders(),
        },
        body: form,
      },
    );
  }

  async sendVerificationEmail(content: string): Promise<void> {
    this.senEmail('Verify Your Email', content);
  }
}
