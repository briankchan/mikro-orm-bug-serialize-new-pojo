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
  #typeGuard: undefined

  @Property()
  line1!: string

  @Property()
  line2!: string

  // only exists for testing; not necessary otherwise
  static checkType(obj: Address) {
    return #typeGuard in obj
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Address],
    debug: ['query', 'query-params'],
    forceEntityConstructor: true, // required for entities/embeddables that use private properties
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('constructor', async () => {
  const user = orm.em.create(User, { addresses: [] });
  const add = new Address()
  add.line1 = 'a'
  add.line2 = 'b'
  user.addresses.push(add)
  expect(Address.checkType(user.addresses[0])).toBe(true);
});

test('create with entity', async () => {
  const user = orm.em.create(User, { addresses: [{
    line1: 'a',
    line2: 'b'
  }] });
  expect(Address.checkType(user.addresses[0])).toBe(true);
});

// the following two tests fail type checking and at runtime
// test('push then serialize', async () => {
//   const user = orm.em.create(User, { addresses: [] });
//   user.addresses.push({
//     line1: 'a',
//     line2: 'b'
//   })
//   console.log(wrap(user).serialize())
// });

// test('set (=) then serialize', async () => {
//   const user = orm.em.create(User, { addresses: [] });
//   user.addresses = [
//     {
//       line1: 'a',
//       line2: 'b'
//     },
//   ]
//   console.log(wrap(user).serialize())
// });

test('assign to entity', async () => {
  const user = orm.em.create(User, { addresses: [] });
  wrap(user).assign({
    addresses: [
      {
        line1: 'a',
        line2: 'b'
      },
    ]
  }, { em: orm.em })
  expect(Address.checkType(user.addresses[0])).toBe(true);
});

test('save and load db', async () => {
  const user = orm.em.create(User, { addresses: [{
    line1: 'a',
    line2: 'b'
  }] });
  await orm.em.flush()
  orm.em.clear()

  const [user2] = await orm.em.find(User, {})
  expect(Address.checkType(user2.addresses[0])).toBe(true);
});
