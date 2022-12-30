interface IValidationsKyc {
  regra: string;
  nome: string;
  descricao: string;
  resultado: string;
  mensagem: string;
}

export interface IInputCreateAccountOnboardBgc {
  account: {
    taxIdentifier: string;
    name: string;
    bornAt: string;
    cellphone: string;
    email: string;
  };
  mocks: {
    idwall: {
      matrizBgc: string;
      typeReportBgc: string;
    };
    incognia: {
      installationId: string;
      typeLogin: string;
      typeOnboardAndRecoverPassword: string;
    };
  };
}

export interface IInputCreateAccountOnboardKyc {
  deviceId: string;
  account: {
    id: string;
    taxIdentifier: string;
  };
  mocks: {
    matrizKyc: string;
    typeReportKyc: string;
    validations: IValidationsKyc[];
  };
}

export interface IReturnEndpointValidateDocument {
  accountId: string;
  status: string;
}

export interface IReturnEndpointValidateCellphone {
  status: string;
}

export interface IReturnEndpointValidateEmail {
  status: string;
}

export interface IResponseCreateAccount {
  deviceId: string;
  accountId: string;
  taxIdentifier: string;
}
