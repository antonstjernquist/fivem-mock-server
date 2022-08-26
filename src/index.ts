import express, { Application, RequestHandler } from 'express';
import cors from 'cors';
import { initGlobalVariables } from './globals';

export interface Player {
  name: string;
  license: string;
}

export interface ServerSettings {
  isActive: boolean;
  resourceName: string;
  port?: number;
  mysqlConnection?: string;
  players?: Player[];
  variables?: Record<string, string>;
  exports?: Record<string, Record<string, CallableFunction>>;
  endpoints?: string[];
}

class Server {
  app?: Application;
  isActive: boolean;

  constructor(settings: ServerSettings) {
    this.isActive = settings.isActive;

    if (settings.isActive) {
      initGlobalVariables(settings);

      this.app = express();
      this.app.use(cors());

      this.app.post('/', (_req, res) => {
        res.send(
          'This is a mocked version of a Fivem Server. Available endpoints are: ' +
            settings?.endpoints?.join(' ,')
        );
      });

      /* Create endpoints for the events dispatched by fetchNUI */
      this.createEndpoints(settings.endpoints);

      const port = settings.port ?? 5005;

      this.app.listen(port, () => {
        console.log(`FiveM Mock Server listening on port ${port}`);
      });
    }
  }

  /*
   *   The endpoints will listen for the event being send from NUI and then use "emitNet" for that event on the server.
   *
   *   If you then have a handler setup for that event, it will use that handler in your resource to return
   *   whatever your handler responds with.
   */
  createEndpoints(endpoints: ServerSettings['endpoints'] = []) {
    endpoints.map(key => this.app?.post(...createEndpoint(key)));
  }
}

function createEndpoint(eventName: string): [string, RequestHandler] {
  const endpoint = `/${eventName.replace(':', '-')}`;
  const responseEventName = `${eventName}-response`;

  return [
    endpoint,
    async (_req, res) => {
      /* Emit event on the server that was sent by NUI */
      emitNet(eventName, responseEventName);

      /* Wait for response from your resource handler */
      const result = await new Promise(resolve => {
        onNet(responseEventName, (_source: number, resp: { data: unknown }) => {
          resolve(resp.data);
        });
      });

      /* Send result from your resource handler back to NUI */
      return res.send(result);
    },
  ];
}

export default Server;
