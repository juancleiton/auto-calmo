import qs from 'qs';
import { IInputCreateAccountOnboardKyc } from '@/types/interfaces';
import { Instances } from './instances.service';

export class CreateAccountOnboardKycService {
  private instances: Instances;

  constructor() {
    this.instances = new Instances();
  }

  async execute({
    deviceId,
    account,
    mocks,
  }: IInputCreateAccountOnboardKyc): Promise<any> {
    const instancePagol = await this.instances.getPagol();
    const instanceQaTools = await this.instances.getQaTools();
    const instanceKeycloak = await this.instances.getKeycloak();

    await instanceQaTools.post(
      `/mocks/idwall/mockmanagement/onboarding2/mocksCpf?matriz=${mocks.matrizKyc}&type=${mocks.typeReportKyc}`,
      [
        {
          cpf: account.taxIdentifier,
          validacoes: mocks.validations,
        },
      ],
    );

    const bodyLogin = qs.stringify({
      username: account.taxIdentifier,
      password: 'Pass112233',
      grant_type: process.env.KEYCLOAK_GRANT_TYPE,
      client_id: process.env.KEYCLOAK_CLIENT_ID,
    });

    const { data: responseLogin } = await instanceKeycloak.post(
      `/auth/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      bodyLogin,
      {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      },
    );

    const { data: responseCheckStatus } = await instancePagol.get(
      `/v3/onboarding/check-status-bgc/${account.id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          'Accept-Encoding': null,
          Connection: 'keep-alive',
          Authorization: `Bearer ${responseLogin.access_token}`,
        },
      },
    );

    const { onboard, status, account: accountFound } = responseCheckStatus;

    const { data: responseKyc } = await instancePagol.post(
      `/v3/onboarding/report-kyc`,
      {
        tokenSdk: 'sdk-bf415b74-e07e-48cf-a700-3e5ad810e2f6',
        accountId: account.id,
      },
      {
        headers: {
          Authorization: `Bearer ${responseLogin.access_token}`,
          'device-id': deviceId,
        },
      },
    );

    await instancePagol.put(
      `/onboarding/account/${account.id}/update`,
      {
        type: 1,
        name: accountFound.name,
        taxIdentifier: accountFound.taxIdentifier,
        email: accountFound.email,
        cellphone: accountFound.cellphone,
        bornAt: accountFound.bornAt,
        motherName: accountFound.mother,
        gender: 'M',
        onboardSteps: 6,
        finished: false,
      },
      {
        headers: {
          Authorization: `Bearer ${responseLogin.access_token}`,
          'device-id': deviceId,
        },
      },
    );

    await instancePagol.post(
      `/onboarding/address`,
      {
        alias: 'Casa',
        zipCode: '13092605',
        state: 'SP',
        neighborhood: 'Núcleo Residencial Guararapes',
        city: 'Campinas',
        street: 'Rua B',
        country: 'BR',
        addressNumber: '222',
        complement: 'Perto da Quadra',
        finished: false,
      },
      {
        headers: {
          Authorization: `Bearer ${responseLogin.access_token}`,
          'device-id': deviceId,
        },
      },
    );

    const { data: responseConfirmPin } = await instancePagol.post(
      `/onboarding/confirm-pin`,
      {
        authenticate: {
          pin: '147258',
          attempts: 1,
        },
        accountId: accountFound.id,
      },
      {
        headers: {
          Authorization: `Bearer ${responseLogin.access_token}`,
        },
      },
    );

    return responseConfirmPin;
  }
}
