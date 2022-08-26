import { MockServer, ServerSettings } from '..';

const originalGlobal = global;
beforeEach(() => {
  /* Reset global to a new object representing old global before each test */
  global = { ...originalGlobal };
});

describe('Server SDK', () => {
  describe('isActive', () => {
    test('should NOT populate global space when FALSE', () => {
      new MockServer({
        isActive: false,
        resourceName: 'hotreload',
      });

      expect(global.GetCurrentResourceName).toBe(undefined);
    });

    test('should populate global space when TRUE', () => {
      new MockServer({
        isActive: true,
        resourceName: 'hotreload',
      });

      expect(global.GetCurrentResourceName).not.toBe(undefined);
    });

    test('should not polute global state between tests ..', () => {
      expect(global.GetCurrentResourceName).toBe(undefined);
    });
  });

  describe('Functions', () => {
    const config: ServerSettings = {
      isActive: true,
      resourceName: 'hotreload',
    };
    test('should return resourceName for GetCurrentResourceName', () => {
      new MockServer(config);

      expect(global.GetCurrentResourceName()).toBe('hotreload');
    });

    test('should init global.LoadResourceFile', () => {
      new MockServer(config);
      expect(global.LoadResourceFile).not.toBe(undefined);
    });

    test('should return name for player with GetPlayerName (number)', () => {
      new MockServer({
        ...config,
        players: [
          {
            license: '1',
            name: 'Bingo',
          },
        ],
      });

      expect(global.GetPlayerName(1 as unknown as string)).toBe('Bingo');
    });

    test('should return name for player with GetPlayerName (string)', () => {
      new MockServer({
        ...config,
        players: [
          {
            license: '1',
            name: 'Bingo',
          },
        ],
      });

      expect(global.GetPlayerName('1')).toBe('Bingo');
    });

    test('should not throw when trying to get name from non-existing player', () => {
      new MockServer({
        ...config,
        players: [
          {
            license: '1',
            name: 'Bingo',
          },
        ],
      });

      expect(global.GetPlayerName('2')).toBe(undefined);
    });

    test('should return license in an array for getPlayerIdentifiers', () => {
      new MockServer({
        ...config,
        players: [
          {
            license: 'license:1',
            name: 'Bingo',
          },
        ],
      });

      expect(global.getPlayerIdentifiers(1)).toStrictEqual(['license:1']);
    });

    test('should return / for GetResourcePath', () => {
      new MockServer({
        ...config,
        players: [
          {
            license: 'license:1',
            name: 'Bingo',
          },
        ],
      });

      expect(global.GetResourcePath('')).toBe('/');
    });

    test('should return values for GetConvar for mysql string', () => {
      new MockServer({
        ...config,
        mysqlConnection: 'mysql://root:bruv@localhost/dev',
      });

      expect(global.GetConvar('mysql_connection_string', '')).toBe(
        'mysql://root:bruv@localhost/dev'
      );
    });

    test('should add convars to global', () => {
      new MockServer({
        ...config,
        variables: {
          mysql_connection_string: 'mysql://root:bruv@localhost/dev',
        },
      });

      expect(global.GetConvar('mysql_connection_string', '')).toBe(
        'mysql://root:bruv@localhost/dev'
      );
    });

    test('should add exports to global', () => {
      new MockServer({
        ...config,
        variables: {
          mysql_connection_string: 'mysql://root:bruv@localhost/dev',
        },
        exports: {
          npwd: {
            onCall: () => false,
            exitPhone: () => true,
          },
          pefcl: {
            openBank: () => 'opened',
          },
        },
      });

      expect(global.exports['npwd'].onCall()).toBe(false);
      expect(global.exports['npwd'].exitPhone()).toBe(true);
      expect(global.exports['pefcl'].openBank()).toBe('opened');
    });

    test('should listen to events with on sent by emit', () => {
      new MockServer({
        ...config,
      });

      global.on('event1', (val: string) => {
        expect(val).toBe('meme');
      });

      global.emit('event1', 'meme');
    });

    test('should NOT listen to events with on sent by emitNet', () => {
      new MockServer({
        ...config,
      });

      global.on('event1', (val: string) => {
        expect(val).toBe('meme');
      });

      global.onNet('event1', (val: string) => {
        expect(val).toBe('not meme');
      });

      global.emitNet('event1', 'not meme');
    });
  });

  describe('Endpoints', () => {
    test('should init Express with port', () => {
      const server = new MockServer({
        isActive: true,
        resourceName: 'anything',
        port: 6000,
      });
      expect(server.app.listen).toHaveBeenCalledWith(6000, expect.anything());
    });

    test('should create endpoint from config', () => {
      const server = new MockServer({
        isActive: true,
        resourceName: 'anything',
        endpoints: ['pefcl:getAccounts', 'npwd:getUser'],
      });

      /* Replaces ":" with "-" to avoid conflicts with params in Express */
      expect(server.app.post).toHaveBeenCalledWith(
        '/pefcl-getAccounts',
        expect.anything()
      );
      expect(server.app.post).toHaveBeenCalledWith(
        '/npwd-getUser',
        expect.anything()
      );
    });
  });
});
