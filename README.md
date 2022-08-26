# FiveM Mock Server - FMS

Fivem Mock Server is a simple way of running your resource backend on a Node environment without needing to start your entire server.

_This is a development resource._

<br />

## Goal

The main goal of FMS is to allow a easy development server to run single resources when building them. You can easily set up endpoints for your mocked server & test them directly from the UI running like they would in FiveM.

<br />

## Installation

---

The installation is quite straight forward. You basically need to setup the server to handle the requests from your NUI-client.

### Server

```Typescript
import { MockServer } from 'fivem-mock-server';

new MockServer({
    isActive: true,
    resourceName: 'resouce-name',
    mysqlConnection: 'mysql://root:bruv@localhost/dev',
    players: [
        { // Source is 1
            name: 'Bingo',
            license: 'license:1'
        },
        { // Source is 2
            name: 'Player2',
            license: 'license:2'
        },
    ],
    exports: {
        pefcl: {
            openBank: () => { ... }
        }
    }
});
```

<br />

### NUI

You need to use a specific url when in development to point the fetch to your mock server.

```Typescript
const resourceName = getResourceName();
const url = isDevelopment
? 'http://localhost:3005/${eventName.replace(':', '-')}'
: 'https://${resourceName}/${eventName}';
```

This will allow your requests using this function to 

<br />

#### Full example for fetchNui function 

```Typescript
export const fetchNui = async (
  eventName: string,
  data?: unknown,
) => {
  const resourceName = getResourceName();
  const url = isDevelopment
    ? `http://localhost:3005/${eventName.replace(':', '-')}`
    : `https://${resourceName}/${eventName}`;

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(data),
  };

  const res = await fetch(url, options);
  const response = await res.json();

  if (response.status === 'error') {
    throw new Error(response.errorMsg);
  }

  return response.data;
};
```

## Additional Notes

Need further support? Join our [Discord](https://discord.com/invite/HYwBjTbAY5)!
