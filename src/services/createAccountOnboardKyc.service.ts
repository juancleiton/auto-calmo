import qs from 'qs';
import { IInputCreateAccountOnboardKyc } from '@/types/interfaces';
import { Instances } from './instances.service';
import { CheckStatusBgc, OnboardPhases } from '@/enums/onboard';

export class CreateAccountOnboardKycService {
  private instances: Instances;

  constructor() {
    this.instances = new Instances();
  }

  async execute({
    deviceId,
    account,
    mocks: { idwall, incognia },
  }: IInputCreateAccountOnboardKyc): Promise<any> {
    const instancePagol = await this.instances.getPagol();
    const instanceQaTools = await this.instances.getQaTools();

    const CODE_TOKEN = '112233';
    const PASSWORD_DEFAULT = 'Pass112233';
    const PIN_DEFAULT = '147258';

    // Criar Mock QATools Idwall KYC
    await instanceQaTools.post(
      `/mocks/idwall/mockmanagement/onboarding2/mocksCpf?matriz=${idwall.matrizKyc}&type=${idwall.typeReportKyc}`,
      [
        {
          cpf: account.taxIdentifier,
          validacoes: idwall.validations,
        },
      ],
    );

    // Fazendo Login
    const { data: responseLogin } = await instancePagol.post(`/auth/token`, {
      taxIdentifier: account.taxIdentifier,
      password: PASSWORD_DEFAULT,
      installationId: incognia.installationId,
    });

    // Checando situação da conta
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

    // Travas para onboard 1
    if (
      onboard === OnboardPhases.ACCOUNT_ORDINARY &&
      status !== CheckStatusBgc.OK
    ) {
      throw new Error(
        `Esta conta ainda não está ordinária aprovada. Onboard ${onboard} e status ${status}`,
      );
    }

    // Travas para onboard 2
    if (
      onboard === OnboardPhases.UNLIMITED_ACCOUNT &&
      [
        CheckStatusBgc.OK,
        CheckStatusBgc.REPROVED,
        CheckStatusBgc.BLOCKED,
      ].includes(status)
    ) {
      throw new Error(
        `Esta conta não pode fazer a jornada 2. Onboard ${onboard} e status ${status}`,
      );
    }

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
