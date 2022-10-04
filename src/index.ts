import express, { Application, RequestHandler } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { initGlobalVariables } from './globals';

export interface Player {
  name: string;
  license: string;
}

export type ResourceStatus =
  | 'missing'
  | 'started'
  | 'starting'
  | 'stopped'
  | 'stopping'
  | 'uninitialized'
  | 'unknown';

export interface ServerSettings {
  isActive: boolean;
  resourceName: string;
  port?: number;
  mysqlConnection?: string;
  players?: Player[];
  variables?: Record<string, string>;
  exports?: Record<string, Record<string, CallableFunction>>;
  endpoints?: string[];
  resourceStates?: Record<string, ResourceStatus>;
}

export class MockServer {
  app?: Application;
  isActive: boolean;

  constructor(settings: ServerSettings) {
    this.isActive = settings.isActive;

    if (settings.isActive) {
      initGlobalVariables(settings);

      this.app = express();
      this.app.use(cors());
      this.app.use(bodyParser());

      this.app.get('/', (_req, res) => {
        res.send(
          'This is a mocked version of a Fivem Server. Available endpoints are: ' +
            settings?.endpoints?.join(' ,')
        );
      });

      /* Create endpoints for the events dispatched by fetchNUI */
      this.createEndpoints(settings.endpoints);

      const port = settings.port ?? 5005;

      this.app.listen(port, () => {
        console.log(`FiveM Mock Server available at http://localhost:${port}`);
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
    async (req, res) => {
      /* Emit event on the server that was sent by NUI */
      emitNet(eventName, responseEventName, req.body);

      /* Wait for response from your resource handler */
      const result = await new Promise(resolve => {
        onNet(responseEventName, (_source: number, resp: { data: unknown }) => {
          resolve(resp);
        });
      });

      /* Send result from your resource handler back to NUI */
      return res.send(result);
    },
  ];
}
