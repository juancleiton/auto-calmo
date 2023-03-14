import { CreateAccountOnboardBgcService } from '@/services/createAccountOnboardBgc.service';
import { CreateAccountOnboardKycService } from '@/services/createAccountOnboardKyc.service';
import { Request, Response } from 'express';
export class CreateAccountOnboardController {
  constructor() {}

  async createBgc(request: Request, response: Response): Promise<any> {
    try {
      const {
        account: { taxIdentifier, bornAt, cellphone, email, name },
        mocks: {
          idwall: { matrizBgc, typeReportBgc },
          incognia: {
            installationId,
            typeLogin,
            typeOnboardAndRecoverPassword,
          },
        },
      } = request.body;

      const createAccountOnboardService = new CreateAccountOnboardBgcService();
      const result = await createAccountOnboardService.execute({
        account: {
          taxIdentifier,
          bornAt,
          cellphone,
          email,
          name,
        },
        mocks: {
          idwall: {
            matrizBgc,
            typeReportBgc,
          },
          incognia: {
            installationId,
            typeLogin,
            typeOnboardAndRecoverPassword,
          },
        },
      });
      response.status(200).json({
        message: 'Onboard - Jornada 1 concluída.',
        data: result,
      });
    } catch (error: any) {
      response.status(400).json({
        message: 'Houve um error no endpoint de criação de conta jornada 1',
        error,
      });
    }
  }

  async createKyc(request: Request, response: Response): Promise<any> {
    try {
      const {
        deviceId,
        account: { id, taxIdentifier },
        mocks: {
          idwall: { matrizKyc, typeReportKyc, validations },
        },
        incognia: { installationId },
      } = request.body;

      const createAccountOnboardKycService =
        new CreateAccountOnboardKycService();
      const result = await createAccountOnboardKycService.execute({
        deviceId,
        account: { id, taxIdentifier },
        mocks: {
          idwall: {
            matrizKyc,
            typeReportKyc,
            validations,
          },
          incognia: {
            installationId,
          },
        },
      });

      response.status(200).json({
        message: 'Onboard - Jornada 2 concluída.',
        data: result,
      });
    } catch (error: any) {
      response.status(400).json({
        message: 'Houve um error no endpoint de criação de conta jornada 2',
        error,
      });
    }
  }
}
