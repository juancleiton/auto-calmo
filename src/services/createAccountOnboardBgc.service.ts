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
    mocks: { idwall, incognia },
  }: IInputCreateAccountOnboardBgc): Promise<IResponseCreateAccount> {
    const instancePagol = await this.instances.getPagol();
    const instanceQaTools = await this.instances.getQaTools();

    const CODE_TOKEN = '112233';
    const PASSWORD_DEFAULT = 'Pass112233';
    const PIN_DEFAULT = '147258';
    const deviceId = v4();

    // Criar Mock QATools Incognia
    await instanceQaTools.post(`/mocks/incognia/mockmanagement/mocks`, [
      {
        installationId: incognia.installationId,
        login: {
          mock: incognia.typeLogin,
          data: {
            probable_root: true,
            emulator: true,
            gps_spoofing: true,
            from_official_store: true,
            app_tampering: true,
          },
        },
        onboardingEsqueciSenha: {
          mock: incognia.typeOnboardAndRecoverPassword,
          data: {
            probable_root: true,
            emulator: true,
            gps_spoofing: true,
            from_official_store: false,
            app_tampering: true,
          },
        },
      },
    ]);

    // Criar Mock QATools Idwall
    await instanceQaTools.post(
      `/mocks/idwall/mockmanagement/onboarding1/mocksCpfAndNameAndBirthday?matriz=${idwall.matrizBgc}&type=${idwall.typeReportBgc}`,
      [
        {
          cpf: account.taxIdentifier,
          name: account.name,
          dataNascimento: account.bornAt,
        },
      ],
    );

    // Validate Document
    const { data: responseValidateDocument } =
      await instancePagol.get<IReturnEndpointValidateDocument>(
        `/onboarding/validate-document?value=${account.taxIdentifier}&installationId=${incognia.installationId}`,
      );

    // Validate Cellphone
    await instancePagol.get<IReturnEndpointValidateCellphone>(
      `/onboarding/validate-cellphone?value=${account.cellphone}`,
    );

    // Register Device
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

    // Validate Token
    await instancePagol.post(
      `/onboarding/validate-token`,
      {
        code: CODE_TOKEN,
        cellphone: account.cellphone,
      },
      {
        headers: {
          'device-id': deviceId,
        },
      },
    );

    // Validate E-mail
    await instancePagol.get<IReturnEndpointValidateEmail>(
      `/onboarding/validate-email?value=${account.email}`,
    );

    await instancePagol.post(`/onboarding/validate-token-email`, {
      code: CODE_TOKEN,
      email: account.email,
    });

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
        tokenSms: CODE_TOKEN,
        tokenEmail: CODE_TOKEN,
        password: PASSWORD_DEFAULT,
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
          token: PIN_DEFAULT,
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
