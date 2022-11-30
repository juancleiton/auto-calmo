import { CreateAccountOnboardController } from '@/controllers/createAccountOnboard.controller';
import { Router } from 'express';

const router = Router();

router.post('/onboard/bgc', new CreateAccountOnboardController().createBgc);

router.post('/onboard/kyc', new CreateAccountOnboardController().createKyc);

router.get('/me', (request, response) =>
  response.status(200).json({
    company: 'CALMÔ',
    url: `${process.env.API_URL}`,
    version: 'v1',
    status: 'active',
    use: 'private',
  }),
);

export { router };
