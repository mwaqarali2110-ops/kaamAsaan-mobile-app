const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async get<T>(data: T): Promise<T> {
    await delay();
    return data;
  },
  async post<TResponse, TBody = unknown>(response: TResponse, _body: TBody): Promise<TResponse> {
    await delay(400);
    return response;
  }
};
