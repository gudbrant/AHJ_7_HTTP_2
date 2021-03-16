const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();
const uuid = require('uuid');

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port)

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers};
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
    ctx.response.status = 204;
  }
});

const tickets = [];

class Tickets {
  constructor(id, name, description, status, created) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.status = status;
    this.created = created;
  }
}

const exampleTicket = new Tickets(uuid.v4(), 'Второе', 'По-прежнему что-то нужно', false, new Date());
tickets.push(exampleTicket);

app.use(async ctx => {
  // GET
  if (ctx.method === 'GET') {
    const { method } = ctx.request.query;
    switch (method) {
      case 'allTickets':
        ctx.response.body = tickets.map((item) => {
          return {
            id: item.id,
            name: item.name,
            status: item.status,
            created: item.created,
          };
        });
        return;
      case 'ticketById':
        const { id } = ctx.request.query;
        if (id) {
          const ticket = tickets.find(item => item.id == id);
          if (ticket) {
            ctx.response.body = ticket;
          } else {
            ctx.response.status = 404;
          }
        }
        return;
      default: 
        ctx.response.status = 404;
        return;
    }
  }

  // POST
  if (ctx.method === 'POST') {
    const { name, description } = ctx.request.body;
    const id = uuid.v4();
    const created = new Date();
    tickets.push(new Tickets(id, name, description, false, created));
    ctx.response.body = tickets;
    return;
  };

  // PUT
  if (ctx.method === 'PUT') {
    const { id, name, description } = ctx.request.body;
    const index = tickets.findIndex((item) => item.id === id);
    tickets[index].name = name;
    tickets[index].description = description;
    ctx.response.body = 'ok';
    return;
  }

  // PATCH
  if (ctx.method === 'PATCH') {
    const { id, status } = ctx.request.query;
    const index = tickets.findIndex((item) => item.id === id);
    tickets[index].status = status;
    ctx.response.body = 'ok';
    return;
  }

  // DELETE
  if (ctx.method === 'DELETE') {
    const { id } = ctx.request.query;
    // tickets = tickets.filter((item) => item.id !== id);
    const foundIndex = tickets.findIndex((item) => item.id === id);
    tickets.splice(foundIndex, 1);
    ctx.response.body = 'ok';
    return;
  }
});
