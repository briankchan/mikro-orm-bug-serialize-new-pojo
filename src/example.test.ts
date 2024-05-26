import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded({ array: true, entity: () => Address })
  addresses!: Address[]
}

@Embeddable()
class Address {
  @Property()
  line1!: string

  @Property()
  line2!: string
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Address],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('create with entity then serialize', async () => {
  const user = orm.em.create(User, { addresses: [{
    line1: 'a',
    line2: 'b'
  }] });
  console.log(wrap(user).serialize())
});

test('push then serialize', async () => {
  const user = orm.em.create(User, { addresses: [] });
  user.addresses.push({
    line1: 'a',
    line2: 'b'
  })
  console.log(wrap(user).serialize())
});
test('push then toObject', async () => {
  const user = orm.em.create(User, { addresses: [] });
  user.addresses.push({
    line1: 'a',
    line2: 'b'
  })
  console.log(wrap(user).toObject())
});

test('set (=) then serialize', async () => {
  const user = orm.em.create(User, { addresses: [] });
  user.addresses = [
    {
      line1: 'a',
      line2: 'b'
    },
  ]
  console.log(wrap(user).serialize())
});

test('assign then serialize', async () => {
  const user = orm.em.create(User, { addresses: [] });
  wrap(user).assign({
    addresses: [
      {
        line1: 'a',
        line2: 'b'
      },
    ]
  }, { em: orm.em })
  console.log(wrap(user).serialize())
});

test('create embeddable', async () => {
  const user = orm.em.create(User, { addresses: [] });
  user.addresses.push(orm.em.create(Address, {
    line1: 'a',
    line2: 'b'
  }))
  console.log(wrap(user).serialize())
});
