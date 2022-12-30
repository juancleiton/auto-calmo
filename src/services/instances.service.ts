import axios, { AxiosInstance } from 'axios';

export class Instances {
  async getPagol(): Promise<AxiosInstance> {
    const instance = axios.create({
      baseURL: process.env.NGROK_URL,
    });

    instance.interceptors.response.use(
      (response: any) => {
        // console.log('Deu certo a chamada da API');
        return response;
      },
      (err: any) => {
        console.log('Deu um erro ao acionar uma api da Pagol', err);
        return Promise.reject(err);
      },
    );

    return instance;
  }

  async getQaTools(): Promise<AxiosInstance> {
    const instance = axios.create({
      baseURL: process.env.QATOOLS_URL,
    });

    instance.interceptors.response.use(
      (response: any) => {
        // console.log('Deu certo a chamada da API');
        return response;
      },
      (err: any) => {
        console.log('Deu um erro ao acionar uma api do QA Tools', err);
        return Promise.reject(err);
      },
    );

    return instance;
  }
}
