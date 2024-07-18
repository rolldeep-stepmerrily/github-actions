import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PhoneNumberPipe implements PipeTransform {
  transform(value: any) {
    const isValidPhoneNumber = /^[0-9]{11}$/.test(value);

    if (!isValidPhoneNumber) {
      throw new BadRequestException();
    }

    return value;
  }
}
