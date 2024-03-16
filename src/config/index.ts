interface IConfig {
  endpoint: string;
  path: string;
  github: string;
}

const isDevelopment = true;

const Config: IConfig = {
  endpoint: "http://127.0.0.1:8000",
  path: isDevelopment ? "/socket.io" : "/backend/socket.io",
  github: "https://github.com/jhmeeel",
};

export default Config;
