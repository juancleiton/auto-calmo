import {
  IInputCreateAccountOnboardBgc,
  IResponseCreateAccount,
  IReturnEndpointValidateCellphone,
  IReturnEndpointValidateDocument,
  IReturnEndpointValidateEmail,
} from '@/types/interfaces';

import { v4 } from 'uuid';
import { Instances } from './instances.service';

export class CreateAccountOnboardBgcService {
  private instances: Instances;

  constructor() {
    this.instances = new Instances();
  }

  async execute({
    account,
    mocks,
  }: IInputCreateAccountOnboardBgc): Promise<IResponseCreateAccount> {
    const instancePagol = await this.instances.getPagol();
    const instanceQaTools = await this.instances.getQaTools();

    await instanceQaTools.post(
      `/mocks/idwall/mockmanagement/onboarding1/mocksCpfAndNameAndBirthday?matriz=${mocks.matrizBgc}&type=${mocks.typeReportBgc}`,
      [
        {
          cpf: account.taxIdentifier,
          name: account.name,
          dataNascimento: account.bornAt,
        },
      ],
    );

    const { data: responseValidateDocument } =
      await instancePagol.get<IReturnEndpointValidateDocument>(
        `/onboarding/validate-document?value=${account.taxIdentifier}`,
      );

    await instancePagol.get<IReturnEndpointValidateCellphone>(
      `/onboarding/validate-cellphone?value=${account.cellphone}`,
    );

    const deviceId = v4();

    await instancePagol.post(`/onboarding/register-device`, {
      deviceInfo: {
        deviceId,
        cellphone: account.cellphone,
        deviceType: 1,
        model: 'iPhone 8',
        manufacturer: 'Apple',
        carrier: 'Vivo',
      },
      publicKey: '',
    });

    await instancePagol.post(
      `/onboarding/validate-token`,
      {
        code: '112233',
        cellphone: account.cellphone,
      },
      {
        headers: {
          'device-id': deviceId,
        },
      },
    );

    await instancePagol.get<IReturnEndpointValidateEmail>(
      `/onboarding/validate-email?value=${account.email}`,
    );

    const { data } = await instancePagol.put(
      `/onboarding/account/${responseValidateDocument.accountId}/create-user`,
      {
        metadata: {
          deviceInfo: {
            carrier: 'TIM',
            deviceId: 'bd9bc93ab2145d25',
            deviceType: 1,
            platform: 'android',
            manufacturer: 'motorola',
            model: 'moto g(8) play',
            macAddress: '12:DF:60:4F:D0:97',
            ipAddress: '192.168.15.58',
            deviceOSVersion: '10',
            availableStorage: 9037447168,
            appVersion: '1.14.13',
          },
          position: {
            mocked: false,
            timestamp: 1665433420658,
            provider: 'fused',
            coords: {
              altitudeAccuracy: 1,
              speed: 0.05114448443055153,
              heading: 33.34368896484375,
              accuracy: 11.72599983215332,
              altitude: 667.800048828125,
              longitude: -47.0641834,
              latitude: -22.9041735,
            },
          },
        },
        login: account.taxIdentifier,
        password: 'Pass112233',
        name: account.name,
        cellphone: account.cellphone,
        account: {
          gender: 'M',
          type: 1,
          name: account.name,
          taxIdentifier: account.taxIdentifier,
          email: account.email,
          cellphone: account.cellphone,
          bornAt: account.bornAt,
          motherName: 'Maria Aparecida Conceição',
          income: 10000,
        },
        pin: {
          token: '147258',
          type: 2,
        },
      },
      {
        headers: {
          'device-id': deviceId,
        },
      },
    );

    return {
      deviceId,
      accountId: responseValidateDocument.accountId,
      taxIdentifier: account.taxIdentifier,
    };
  }
}
