import EventEmitter from 'events';
import { readFileSync } from 'fs';
import path from 'path';
import { Player, ResourceStatus, ServerSettings } from '.';

export const initGlobalVariables = (settings: ServerSettings) => {
  const baseDir = path.resolve(__dirname + '/../../');
  const convars = {
    mysql_connection_string: settings.mysqlConnection,
    ...settings.variables,
  };

  const players: Record<string, Player> =
    settings.players?.reduce((prev, val, idx) => {
      return {
        ...prev,
        [`${idx + 1}`]: {
          ...val,
        },
      };
    }, {}) ?? {};

  const ServerEmitter = new EventEmitter();
  const NetEmitter = new EventEmitter();

  global.GetCurrentResourceName = () => {
    return settings.resourceName;
  };

  global.GetResourceState = (resource: string): ResourceStatus => {
    return settings.resourceStates[resource] ?? 'uninitialized';
  };

  global.LoadResourceFile = (_resourceName: string, fileName: string) => {
    const file = readFileSync(`${baseDir}/${fileName}`, 'utf-8');
    return file;
  };

  global.GetPlayerName = (source: keyof typeof players) => {
    const player = players[source];
    return player?.name;
  };

  global.getPlayerIdentifiers = (source: keyof typeof players) => {
    const player = players[source];
    return [player?.license];
  };

  global.GetResourcePath = () => {
    return '/';
  };

  global.GetConvar = (convar: keyof typeof convars, fallback: string) => {
    return convars[convar] ?? fallback;
  };

  global.exports = settings.exports;

  global.on = (event: string, listeners: (...args: any[]) => void) => {
    ServerEmitter.on(event, listeners);
  };

  global.onNet = (event: string, listeners: (...args: any[]) => void) => {
    NetEmitter.on(event, listeners);
  };

  global.emit = (event: string, listeners: (...args: any[]) => void) => {
    ServerEmitter.emit(event, listeners);
  };

  global.emitNet = (event: string, ...args: any[]) => {
    NetEmitter.emit(event, ...args);
  };
};
