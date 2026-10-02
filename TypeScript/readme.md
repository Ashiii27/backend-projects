TypeScript: Complete Guide from Basics to Advanced
Table of Contents
Introduction
Setup & Installation
Basic Types
Type Annotations & Type Inference
Interfaces
Type Aliases
Union & Intersection Types
Literal Types
Enums
Arrays & Tuples
Functions
Objects
Classes
Access Modifiers
Abstract Classes
Generics
Type Assertions
Type Guards & Narrowing
Utility Types
Mapped Types
Conditional Types
Template Literal Types
Keyof & Typeof Operators
Indexed Access Types
Modules & Namespaces
Declaration Files
Decorators
Mixins
Type Compatibility & Structural Typing
Symbols
Iterators & Generators
Async/Await & Promises
Triple-Slash Directives
tsconfig.json Configuration
Strict Mode Options
Discriminated Unions
Overloading
Infer Keyword
Recursive Types
Variance Annotations
Satisfies Operator
Using Keyword (Disposable Resources)
Performance Tips
References & Resources
Introduction
TypeScript is a statically typed superset of JavaScript developed and maintained by Microsoft. It compiles down to plain JavaScript and can run anywhere JavaScript runs — in a browser, on Node.js, or in any JavaScript engine.

Why TypeScript?
Static Type Checking — Catches bugs at compile time rather than runtime.
Enhanced IDE Support — Autocompletion, navigation, refactoring.
Better Readability & Maintainability — Types serve as documentation.
Modern JavaScript Features — Supports ESNext features and compiles to older targets.
Large Ecosystem — DefinitelyTyped provides type definitions for thousands of libraries.
Reference: TypeScript Official Website

Setup & Installation
Prerequisites
Node.js (v14 or later recommended)
npm or yarn
Install TypeScript Globally
Bash

npm install -g typescript
Verify Installation
Bash

tsc --version
Initialize a TypeScript Project
Bash

mkdir my-ts-project
cd my-ts-project
npm init -y
npm install typescript --save-dev
npx tsc --init
This creates a tsconfig.json file with default settings.

Compile a TypeScript File
Bash

# Create a file
echo 'const greeting: string = "Hello, TypeScript!"; console.log(greeting);' > index.ts

# Compile
tsc index.ts

# Run
node index.js
Using ts-node (Run TypeScript directly)
Bash

npm install -g ts-node
ts-node index.ts
Reference: TypeScript Installation Guide

Basic Types
TypeScript provides several built-in types that correspond to JavaScript primitives and more.

Primitive Types
TypeScript

// string
let firstName: string = "John";
let templateStr: string = `Hello, ${firstName}`;

// number (integer and floating-point)
let age: number = 30;
let price: number = 19.99;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;

// boolean
let isActive: boolean = true;
let isCompleted: boolean = false;

// null and undefined
let nothing: null = null;
let notDefined: undefined = undefined;

// bigint (ES2020+)
let bigNumber: bigint = 100n;
let anotherBig: bigint = BigInt(100);

// symbol
let uniqueKey: symbol = Symbol("key");
let anotherKey: symbol = Symbol("key");
console.log(uniqueKey === anotherKey); // false
Special Types
TypeScript

// any — opt out of type checking
let flexible: any = "hello";
flexible = 42;
flexible = true;
flexible.nonExistentMethod(); // No compile error!

// unknown — type-safe counterpart of any
let uncertain: unknown = "hello";
uncertain = 42;
// uncertain.toFixed(); // Error! Must narrow the type first
if (typeof uncertain === "number") {
  uncertain.toFixed(); // OK after type guard
}

// void — absence of return value
function logMessage(msg: string): void {
  console.log(msg);
}

// never — values that never occur
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}

// object — any non-primitive type
let obj: object = { name: "John" };
let arr: object = [1, 2, 3];
// let primitive: object = 42; // Error!
Difference between any, unknown, and never
Type	Description	Type-safe?
any	Disables type checking	❌
unknown	Must narrow before use	✅
never	Represents unreachable code / no value	✅
Reference: TypeScript Basic Types

Type Annotations & Type Inference
Type Annotations
Explicitly telling TypeScript what type a variable should hold.

TypeScript

let username: string = "Alice";
let score: number = 100;
let isOnline: boolean = true;
let hobbies: string[] = ["reading", "gaming"];
let coordinates: [number, number] = [10, 20];
Type Inference
TypeScript automatically infers the type based on the assigned value.

TypeScript

let city = "New York"; // inferred as string
let count = 42;        // inferred as number
let flag = false;      // inferred as boolean

// Inference with functions
function add(a: number, b: number) {
  return a + b; // Return type inferred as number
}

// Contextual typing
const names = ["Alice", "Bob", "Charlie"];
names.forEach((name) => {
  console.log(name.toUpperCase()); // 'name' inferred as string
});
When to Use Annotations vs. Inference
TypeScript

// ✅ Let TypeScript infer when it's obvious
let message = "Hello"; // No need for : string

// ✅ Use annotations when inference doesn't work
let result: number | string;
result = 42;
result = "forty-two";

// ✅ Use annotations for function parameters
function greet(name: string): string {
  return `Hello, ${name}`;
}

// ✅ Use annotations for empty arrays
let items: string[] = [];

// ✅ Use annotations for delayed initialization
let laterValue: number;
laterValue = 100;
Reference: TypeScript Type Inference

Interfaces
Interfaces define the shape of an object. They are one of TypeScript's core features for defining contracts.

Basic Interface
TypeScript

interface User {
  name: string;
  age: number;
  email: string;
}

const user: User = {
  name: "Alice",
  age: 25,
  email: "alice@example.com",
};
Optional Properties
TypeScript

interface Product {
  id: number;
  name: string;
  description?: string; // optional
  price: number;
}

const product: Product = {
  id: 1,
  name: "Laptop",
  price: 999,
  // description is optional
};
Readonly Properties
TypeScript

interface Config {
  readonly apiUrl: string;
  readonly port: number;
}

const config: Config = {
  apiUrl: "https://api.example.com",
  port: 3000,
};

// config.apiUrl = "https://other.com"; // Error! Cannot assign to readonly
Extending Interfaces
TypeScript

interface Animal {
  name: string;
  age: number;
}

interface Dog extends Animal {
  breed: string;
  bark(): void;
}

const myDog: Dog = {
  name: "Rex",
  age: 3,
  breed: "German Shepherd",
  bark() {
    console.log("Woof!");
  },
};
Multiple Inheritance
TypeScript

interface Shape {
  color: string;
}

interface Dimensions {
  width: number;
  height: number;
}

interface Rectangle extends Shape, Dimensions {
  area(): number;
}

const rect: Rectangle = {
  color: "blue",
  width: 10,
  height: 20,
  area() {
    return this.width * this.height;
  },
};
Interface for Functions
TypeScript

interface MathOperation {
  (a: number, b: number): number;
}

const add: MathOperation = (a, b) => a + b;
const subtract: MathOperation = (a, b) => a - b;

console.log(add(5, 3));      // 8
console.log(subtract(10, 4)); // 6
Interface for Indexable Types
TypeScript

interface StringDictionary {
  [key: string]: string;
}

const headers: StringDictionary = {
  "Content-Type": "application/json",
  Authorization: "Bearer token123",
};

interface NumberArray {
  [index: number]: string;
}

const fruits: NumberArray = ["Apple", "Banana", "Cherry"];
Declaration Merging
TypeScript

interface Box {
  height: number;
  width: number;
}

interface Box {
  depth: number;
}

// Both declarations are merged
const box: Box = {
  height: 5,
  width: 6,
  depth: 10,
};
Reference: TypeScript Interfaces

Type Aliases
Type aliases create a new name for a type. They can represent primitives, unions, tuples, objects, and more.

Basic Type Alias
TypeScript

type StringOrNumber = string | number;
type ID = string | number;
type Callback = (data: string) => void;

let userId: ID = 101;
userId = "user-101";

const handler: Callback = (data) => {
  console.log(data);
};
Object Type Alias
TypeScript

type Point = {
  x: number;
  y: number;
};

type Point3D = Point & {
  z: number;
};

const point: Point3D = { x: 1, y: 2, z: 3 };
Interface vs Type Alias
Feature	Interface	Type Alias
Object shapes	✅	✅
Declaration merging	✅	❌
Extends/Implements	✅	✅ (via &)
Union types	❌	✅
Primitive aliases	❌	✅
Tuple types	❌	✅
Computed properties	❌	✅
TypeScript

// Type alias can do things interfaces can't
type Status = "active" | "inactive" | "pending";
type Pair = [string, number];
type Nullable<T> = T | null;

// Interface can do declaration merging (type alias can't)
interface Window {
  customProperty: string;
}
Reference: TypeScript Type Aliases

Union & Intersection Types
Union Types (|)
A value can be one of several types.

TypeScript

type StringOrNumber = string | number;

function formatValue(value: StringOrNumber): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}

console.log(formatValue("hello")); // "HELLO"
console.log(formatValue(3.14159)); // "3.14"

// Union with literals
type Direction = "north" | "south" | "east" | "west";

function move(direction: Direction): void {
  console.log(`Moving ${direction}`);
}

move("north"); // OK
// move("up"); // Error!

// Union with arrays
function processInput(input: string | string[]): string {
  if (Array.isArray(input)) {
    return input.join(", ");
  }
  return input;
}
Intersection Types (&)
Combine multiple types into one.

TypeScript

interface HasName {
  name: string;
}

interface HasAge {
  age: number;
}

interface HasEmail {
  email: string;
}

type Person = HasName & HasAge & HasEmail;

const person: Person = {
  name: "Alice",
  age: 30,
  email: "alice@example.com",
};

// Intersection with type aliases
type Draggable = {
  drag: () => void;
};

type Resizable = {
  resize: () => void;
};

type UIWidget = Draggable & Resizable;

const widget: UIWidget = {
  drag() {
    console.log("Dragging...");
  },
  resize() {
    console.log("Resizing...");
  },
};
Union vs Intersection
TypeScript

// Union: A OR B
type A = { a: string };
type B = { b: number };

type AOrB = A | B;
const x: AOrB = { a: "hello" };          // OK
const y: AOrB = { b: 42 };               // OK
const z: AOrB = { a: "hello", b: 42 };   // OK

// Intersection: A AND B
type AAndB = A & B;
const w: AAndB = { a: "hello", b: 42 };  // Must have both
// const v: AAndB = { a: "hello" };       // Error! Missing 'b'
Reference: TypeScript Unions and Intersections

Literal Types
Literal types allow you to specify exact values a variable can hold.

String Literal Types
TypeScript

type Theme = "light" | "dark" | "system";

function setTheme(theme: Theme): void {
  console.log(`Setting theme to: ${theme}`);
}

setTheme("dark");   // OK
// setTheme("blue"); // Error!
Numeric Literal Types
TypeScript

type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

function rollDice(): DiceRoll {
  return (Math.floor(Math.random() * 6) + 1) as DiceRoll;
}

type HttpStatusCode = 200 | 201 | 301 | 400 | 401 | 403 | 404 | 500;
Boolean Literal Types
TypeScript

type True = true;
type False = false;

type IsAdmin = true;
Const Assertions
TypeScript

// Without const assertion
let color = "red"; // type: string

// With const assertion
let color2 = "red" as const; // type: "red"

// Objects with const assertion
const config = {
  endpoint: "https://api.example.com",
  port: 3000,
  debug: true,
} as const;

// type is: { readonly endpoint: "https://api.example.com"; readonly port: 3000; readonly debug: true; }

// Arrays with const assertion
const statuses = ["active", "inactive", "pending"] as const;
// type is: readonly ["active", "inactive", "pending"]

type Status = (typeof statuses)[number]; // "active" | "inactive" | "pending"
Reference: TypeScript Literal Types

Enums
Enums allow you to define a set of named constants.

Numeric Enums
TypeScript

enum Direction {
  Up,     // 0
  Down,   // 1
  Left,   // 2
  Right,  // 3
}

let dir: Direction = Direction.Up;
console.log(dir);                // 0
console.log(Direction[0]);       // "Up" (reverse mapping)

// Custom starting value
enum StatusCode {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  NotFound = 404,
  InternalServerError = 500,
}
String Enums
TypeScript

enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

console.log(Color.Red); // "RED"

// String enums don't have reverse mapping
Heterogeneous Enums (Mixed)
TypeScript

enum Mixed {
  No = 0,
  Yes = "YES",
}
// Not recommended — prefer consistent types
Const Enums
TypeScript

const enum Sizes {
  Small = "S",
  Medium = "M",
  Large = "L",
  XLarge = "XL",
}

let shirtSize = Sizes.Medium; // Inlined at compile time

// The entire enum is erased during compilation
// The output is simply: let shirtSize = "M";
Enum as a Type
TypeScript

enum LogLevel {
  Error,
  Warn,
  Info,
  Debug,
}

function log(message: string, level: LogLevel): void {
  if (level === LogLevel.Error) {
    console.error(message);
  } else if (level === LogLevel.Warn) {
    console.warn(message);
  } else {
    console.log(message);
  }
}

log("Something went wrong!", LogLevel.Error);
Computed & Constant Members
TypeScript

enum FileAccess {
  None,                                // constant member
  Read = 1 << 1,                       // constant member (2)
  Write = 1 << 2,                      // constant member (4)
  ReadWrite = Read | Write,            // constant member (6)
  G = "123".length,                    // computed member
}
Reference: TypeScript Enums

Arrays & Tuples
Arrays
TypeScript

// Two syntaxes
let numbers: number[] = [1, 2, 3, 4, 5];
let names: Array<string> = ["Alice", "Bob", "Charlie"];

// Readonly arrays
let readonlyNumbers: readonly number[] = [1, 2, 3];
let readonlyNames: ReadonlyArray<string> = ["Alice", "Bob"];
// readonlyNumbers.push(4); // Error!

// Array of objects
interface Student {
  name: string;
  grade: number;
}

let students: Student[] = [
  { name: "Alice", grade: 90 },
  { name: "Bob", grade: 85 },
];

// Multidimensional arrays
let matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

// Array methods are type-safe
const doubled = numbers.map((n) => n * 2);          // number[]
const filtered = numbers.filter((n) => n > 2);       // number[]
const found = numbers.find((n) => n === 3);          // number | undefined
Tuples
Fixed-length arrays with specific types at each position.

TypeScript

// Basic tuple
let point: [number, number] = [10, 20];
let user: [string, number, boolean] = ["Alice", 30, true];

// Accessing elements
let name = user[0]; // string
let age = user[1];  // number

// Destructuring tuples
const [x, y] = point;
console.log(x, y); // 10 20

// Optional tuple elements
type OptionalTuple = [string, number?, boolean?];
const a: OptionalTuple = ["hello"];
const b: OptionalTuple = ["hello", 42];
const c: OptionalTuple = ["hello", 42, true];

// Rest elements in tuples
type StringAndNumbers = [string, ...number[]];
const d: StringAndNumbers = ["hello", 1, 2, 3, 4, 5];

// Named tuples (TypeScript 4.0+)
type NamedPoint = [x: number, y: number, z?: number];
const point3d: NamedPoint = [1, 2, 3];

// Readonly tuples
type ReadonlyPair = readonly [string, number];
const pair: ReadonlyPair = ["hello", 42];
// pair[0] = "world"; // Error!
Reference: TypeScript Arrays and Tuples

Functions
Function Declarations
TypeScript

// With type annotations
function add(a: number, b: number): number {
  return a + b;
}

// Arrow functions
const multiply = (a: number, b: number): number => a * b;

// Function expressions
const divide: (a: number, b: number) => number = function (a, b) {
  return a / b;
};
Optional & Default Parameters
TypeScript

// Optional parameter
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

greet("Alice");           // "Hello, Alice!"
greet("Alice", "Hi");     // "Hi, Alice!"

// Default parameter
function createUser(name: string, role: string = "user"): object {
  return { name, role };
}

createUser("Alice");           // { name: "Alice", role: "user" }
createUser("Alice", "admin");  // { name: "Alice", role: "admin" }
Rest Parameters
TypeScript

function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

console.log(sum(1, 2, 3, 4, 5)); // 15

function buildName(first: string, ...rest: string[]): string {
  return `${first} ${rest.join(" ")}`;
}
Function Types
TypeScript

// Type alias for function
type Predicate = (value: number) => boolean;

const isPositive: Predicate = (value) => value > 0;
const isEven: Predicate = (value) => value % 2 === 0;

// Interface for function
interface Formatter {
  (value: string): string;
}

const toUpperCase: Formatter = (value) => value.toUpperCase();
Void & Never Return Types
TypeScript

// void - function doesn't return a value
function logMessage(message: string): void {
  console.log(message);
}

// never - function never returns (throws or infinite loop)
function fail(message: string): never {
  throw new Error(message);
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}
this Parameter
TypeScript

interface Card {
  suit: string;
  rank: number;
}

interface Deck {
  suits: string[];
  cards: Card[];
  createCardPicker(this: Deck): () => Card;
}

const deck: Deck = {
  suits: ["hearts", "spades", "clubs", "diamonds"],
  cards: [],
  createCardPicker(this: Deck) {
    return () => {
      let pickedSuit = Math.floor(Math.random() * 4);
      let pickedCard = Math.floor(Math.random() * 13);
      return { suit: this.suits[pickedSuit], rank: pickedCard };
    };
  },
};
Callback Functions
TypeScript

function fetchData(callback: (data: string, error?: Error) => void): void {
  try {
    const data = "Some fetched data";
    callback(data);
  } catch (e) {
    callback("", e as Error);
  }
}

fetchData((data, error) => {
  if (error) {
    console.error(error.message);
  } else {
    console.log(data);
  }
});
Reference: TypeScript Functions

Objects
Object Types
TypeScript

// Inline object type
function printCoord(pt: { x: number; y: number }): void {
  console.log(`x: ${pt.x}, y: ${pt.y}`);
}

printCoord({ x: 3, y: 7 });

// Object type with optional properties
function printName(obj: { first: string; last?: string }): void {
  if (obj.last) {
    console.log(`${obj.first} ${obj.last}`);
  } else {
    console.log(obj.first);
  }
}

printName({ first: "Alice" });
printName({ first: "Alice", last: "Smith" });
Index Signatures
TypeScript

interface StringMap {
  [key: string]: string;
}

const env: StringMap = {
  NODE_ENV: "production",
  PORT: "3000",
  HOST: "localhost",
};

// Index signature with specific properties
interface DataStore {
  id: number;
  [key: string]: number | string; // must be compatible with known properties
}

const store: DataStore = {
  id: 1,
  name: "Test",
  value: 42,
};
Excess Property Checks
TypeScript

interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  return {
    color: config.color || "red",
    area: (config.width || 20) ** 2,
  };
}

// Direct object literal — excess property check applies
// createSquare({ colour: "red", width: 100 }); // Error! 'colour' does not exist

// Workaround 1: Use a variable
const myConfig = { colour: "red", width: 100 };
createSquare(myConfig); // OK — no excess property check on variable assignment

// Workaround 2: Index signature
interface FlexibleSquareConfig {
  color?: string;
  width?: number;
  [propName: string]: any;
}
Object Destructuring with Types
TypeScript

interface ApiResponse {
  data: string[];
  status: number;
  message: string;
}

function handleResponse({ data, status, message }: ApiResponse): void {
  console.log(`Status: ${status}, Message: ${message}`);
  data.forEach((item) => console.log(item));
}

// With default values
function configure({
  host = "localhost",
  port = 3000,
  debug = false,
}: {
  host?: string;
  port?: number;
  debug?: boolean;
} = {}): void {
  console.log(`${host}:${port} (debug: ${debug})`);
}
Reference: TypeScript Object Types

Classes
Basic Class
TypeScript

class Person {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `Hello, my name is ${this.name} and I'm ${this.age} years old.`;
  }
}

const person = new Person("Alice", 30);
console.log(person.greet());
Parameter Properties (Shorthand)
TypeScript

class Employee {
  constructor(
    public name: string,
    private salary: number,
    protected department: string,
    readonly id: number
  ) {}

  getInfo(): string {
    return `${this.name} works in ${this.department}`;
  }
}

const emp = new Employee("Bob", 50000, "Engineering", 1);
console.log(emp.name); // OK
// console.log(emp.salary); // Error! Private
Inheritance
TypeScript

class Animal {
  constructor(public name: string) {}

  move(distance: number): void {
    console.log(`${this.name} moved ${distance} meters.`);
  }

  makeSound(): void {
    console.log("Some generic sound");
  }
}

class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name);
  }

  // Override
  makeSound(): void {
    console.log("Woof! Woof!");
  }

  fetch(item: string): void {
    console.log(`${this.name} fetched the ${item}`);
  }
}

class Cat extends Animal {
  makeSound(): void {
    console.log("Meow!");
  }
}

const dog = new Dog("Rex", "Labrador");
dog.makeSound(); // "Woof! Woof!"
dog.move(10);    // "Rex moved 10 meters."
dog.fetch("ball"); // "Rex fetched the ball"
Implementing Interfaces
TypeScript

interface Printable {
  print(): void;
}

interface Loggable {
  log(message: string): void;
}

class Report implements Printable, Loggable {
  constructor(private title: string) {}

  print(): void {
    console.log(`Printing report: ${this.title}`);
  }

  log(message: string): void {
    console.log(`[${this.title}] ${message}`);
  }
}
Getters and Setters
TypeScript

class Circle {
  private _radius: number;

  constructor(radius: number) {
    this._radius = radius;
  }

  get radius(): number {
    return this._radius;
  }

  set radius(value: number) {
    if (value <= 0) {
      throw new Error("Radius must be positive");
    }
    this._radius = value;
  }

  get area(): number {
    return Math.PI * this._radius ** 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this._radius;
  }
}

const circle = new Circle(5);
console.log(circle.area);          // 78.539...
console.log(circle.circumference); // 31.415...
circle.radius = 10;
// circle.radius = -1;             // Error!
Static Members
TypeScript

class MathUtils {
  static PI: number = 3.14159265359;

  static add(a: number, b: number): number {
    return a + b;
  }

  static factorial(n: number): number {
    if (n <= 1) return 1;
    return n * MathUtils.factorial(n - 1);
  }

  // Static block (TypeScript 4.4+)
  static {
    console.log("MathUtils class initialized");
  }
}

console.log(MathUtils.PI);           // 3.14159265359
console.log(MathUtils.add(2, 3));    // 5
console.log(MathUtils.factorial(5)); // 120
Generic Classes
TypeScript

class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.push(3);
console.log(numberStack.pop()); // 3

const stringStack = new Stack<string>();
stringStack.push("hello");
stringStack.push("world");
Reference: TypeScript Classes

Access Modifiers
TypeScript provides three access modifiers for class members.

TypeScript

class BankAccount {
  public owner: string;         // accessible everywhere
  protected bank: string;       // accessible in class and subclasses
  private balance: number;      // accessible only in this class
  readonly accountNumber: string; // can't be modified after initialization

  constructor(owner: string, balance: number) {
    this.owner = owner;
    this.balance = balance;
    this.bank = "MyBank";
    this.accountNumber = this.generateAccountNumber();
  }

  // Public method
  public getBalance(): number {
    return this.balance;
  }

  // Public method
  public deposit(amount: number): void {
    this.validateAmount(amount);
    this.balance += amount;
  }

  // Public method
  public withdraw(amount: number): void {
    this.validateAmount(amount);
    if (amount > this.balance) {
      throw new Error("Insufficient funds");
    }
    this.balance -= amount;
  }

  // Private method — only accessible within this class
  private validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }
  }

  // Protected method — accessible in subclasses
  protected generateAccountNumber(): string {
    return `ACC-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class SavingsAccount extends BankAccount {
  private interestRate: number;

  constructor(owner: string, balance: number, interestRate: number) {
    super(owner, balance);
    this.interestRate = interestRate;
  }

  applyInterest(): void {
    const interest = this.getBalance() * this.interestRate;
    this.deposit(interest);
    // this.balance += interest;  // Error! 'balance' is private
    console.log(`Interest applied. Bank: ${this.bank}`); // OK — 'bank' is protected
  }
}

const savings = new SavingsAccount("Alice", 1000, 0.05);
savings.deposit(500);
savings.applyInterest();
console.log(savings.owner);           // OK — public
console.log(savings.getBalance());    // OK — public method
// console.log(savings.balance);      // Error! Private
// console.log(savings.bank);         // Error! Protected
// savings.accountNumber = "new";     // Error! Readonly
ECMAScript Private Fields (#)
TypeScript

class SecureVault {
  #secretCode: string;
  #data: Map<string, string>;

  constructor(code: string) {
    this.#secretCode = code;
    this.#data = new Map();
  }

  store(key: string, value: string, code: string): boolean {
    if (code !== this.#secretCode) return false;
    this.#data.set(key, value);
    return true;
  }

  retrieve(key: string, code: string): string | undefined {
    if (code !== this.#secretCode) return undefined;
    return this.#data.get(key);
  }
}

const vault = new SecureVault("1234");
vault.store("password", "mySecret", "1234");
// vault.#secretCode; // SyntaxError — truly private at runtime
Reference: TypeScript Class Members

Abstract Classes
Abstract classes serve as base classes that cannot be instantiated directly. They can contain abstract methods (without implementation) and concrete methods (with implementation).

TypeScript

abstract class Shape {
  constructor(
    public color: string,
    protected x: number,
    protected y: number
  ) {}

  // Abstract methods — must be implemented by subclasses
  abstract area(): number;
  abstract perimeter(): number;
  abstract draw(): void;

  // Concrete method — shared implementation
  describe(): string {
    return `A ${this.color} shape at (${this.x}, ${this.y}) with area ${this.area().toFixed(2)}`;
  }

  moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}

class Circle extends Shape {
  constructor(color: string, x: number, y: number, public radius: number) {
    super(color, x, y);
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }

  draw(): void {
    console.log(`Drawing a ${this.color} circle with radius ${this.radius}`);
  }
}

class Rectangle extends Shape {
  constructor(
    color: string,
    x: number,
    y: number,
    public width: number,
    public height: number
  ) {
    super(color, x, y);
  }

  area(): number {
    return this.width * this.height;
  }

  perimeter(): number {
    return 2 * (this.width + this.height);
  }

  draw(): void {
    console.log(`Drawing a ${this.color} rectangle (${this.width}x${this.height})`);
  }
}

class Triangle extends Shape {
  constructor(
    color: string,
    x: number,
    y: number,
    public base: number,
    public heightLen: number,
    public sideA: number,
    public sideB: number
  ) {
    super(color, x, y);
  }

  area(): number {
    return 0.5 * this.base * this.heightLen;
  }

  perimeter(): number {
    return this.base + this.sideA + this.sideB;
  }

  draw(): void {
    console.log(`Drawing a ${this.color} triangle with base ${this.base}`);
  }
}

// const shape = new Shape("red", 0, 0); // Error! Cannot instantiate abstract class

const shapes: Shape[] = [
  new Circle("red", 0, 0, 5),
  new Rectangle("blue", 10, 10, 20, 30),
  new Triangle("green", 5, 5, 10, 8, 7, 9),
];

shapes.forEach((shape) => {
  shape.draw();
  console.log(shape.describe());
  console.log(`Perimeter: ${shape.perimeter().toFixed(2)}`);
  console.log("---");
});
Abstract Properties
TypeScript

abstract class Vehicle {
  abstract readonly numberOfWheels: number;
  abstract engineType: string;

  abstract start(): void;
  abstract stop(): void;

  describe(): string {
    return `A ${this.engineType} vehicle with ${this.numberOfWheels} wheels`;
  }
}

class Car extends Vehicle {
  readonly numberOfWheels = 4;
  engineType = "gasoline";

  start(): void {
    console.log("Car engine started");
  }

  stop(): void {
    console.log("Car engine stopped");
  }
}

class Bicycle extends Vehicle {
  readonly numberOfWheels = 2;
  engineType = "human-powered";

  start(): void {
    console.log("Start pedaling");
  }

  stop(): void {
    console.log("Stop pedaling");
  }
}
Reference: TypeScript Abstract Classes

Generics
Generics provide a way to create reusable components that work with a variety of types rather than a single one.

Generic Functions
TypeScript

// Without generics — loses type information
function identityAny(value: any): any {
  return value;
}

// With generics — preserves type information
function identity<T>(value: T): T {
  return value;
}

const str = identity<string>("hello");    // type: string
const num = identity<number>(42);         // type: number
const inferred = identity("hello");       // type: string (inferred)

// Multiple type parameters
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const p = pair("hello", 42); // type: [string, number]

// Generic with arrays
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const first = firstElement([1, 2, 3]);       // number | undefined
const firstStr = firstElement(["a", "b"]);   // string | undefined
Generic Constraints
TypeScript

// Constrain T to types that have a 'length' property
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(value: T): T {
  console.log(`Length: ${value.length}`);
  return value;
}

logLength("hello");        // OK — string has length
logLength([1, 2, 3]);      // OK — array has length
logLength({ length: 10 }); // OK — object with length property
// logLength(42);           // Error! Number doesn't have length

// Constrain with keyof
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: "Alice", age: 30 };
const name = getProperty(person, "name");  // string
const age = getProperty(person, "age");    // number
// getProperty(person, "email");           // Error! "email" is not a key of person
Generic Interfaces
TypeScript

interface Repository<T> {
  findById(id: number): T | undefined;
  findAll(): T[];
  create(item: T): T;
  update(id: number, item: Partial<T>): T | undefined;
  delete(id: number): boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
}

class UserRepository implements Repository<User> {
  private users: User[] = [];

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  findAll(): User[] {
    return [...this.users];
  }

  create(user: User): User {
    this.users.push(user);
    return user;
  }

  update(id: number, data: Partial<User>): User | undefined {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
    this.users[index] = { ...this.users[index], ...data };
    return this.users[index];
  }

  delete(id: number): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}
Generic Classes
TypeScript

class KeyValuePair<K, V> {
  constructor(public key: K, public value: V) {}

  toString(): string {
    return `${String(this.key)}: ${String(this.value)}`;
  }
}

const kvp1 = new KeyValuePair<string, number>("age", 30);
const kvp2 = new KeyValuePair<number, string>(1, "hello");

// Generic class with constraints
class SortedList<T extends { compareTo(other: T): number }> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
    this.items.sort((a, b) => a.compareTo(b));
  }

  getAll(): T[] {
    return [...this.items];
  }
}
Generic Defaults
TypeScript

interface ApiResponse<T = any> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

// Uses default type 'any'
const response1: ApiResponse = {
  data: "anything",
  status: 200,
  message: "OK",
  timestamp: new Date(),
};

// Specifies type
const response2: ApiResponse<User[]> = {
  data: [{ id: 1, name: "Alice", email: "alice@example.com" }],
  status: 200,
  message: "OK",
  timestamp: new Date(),
};
Generic Utility Functions
TypeScript

// Generic merge function
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const merged = merge({ name: "Alice" }, { age: 30 });
console.log(merged.name); // string
console.log(merged.age);  // number

// Generic filter function
function filterBy<T, K extends keyof T>(
  items: T[],
  property: K,
  value: T[K]
): T[] {
  return items.filter((item) => item[property] === value);
}

const users = [
  { name: "Alice", role: "admin" },
  { name: "Bob", role: "user" },
  { name: "Charlie", role: "admin" },
];

const admins = filterBy(users, "role", "admin");
Reference: TypeScript Generics

Type Assertions
Type assertions tell the compiler to treat a value as a specific type. They don't perform any runtime conversion.

as Syntax (Preferred)
TypeScript

const someValue: unknown = "this is a string";
const strLength: number = (someValue as string).length;

// DOM element example
const myCanvas = document.getElementById("main_canvas") as HTMLCanvasElement;

// More complex assertion
interface User {
  name: string;
  email: string;
}

const userData: unknown = JSON.parse('{"name": "Alice", "email": "alice@example.com"}');
const user = userData as User;
console.log(user.name);
Angle-Bracket Syntax
TypeScript

// Same thing, different syntax (doesn't work in .tsx files)
const someValue: unknown = "this is a string";
const strLength: number = (<string>someValue).length;
Double Assertion
TypeScript

// When direct assertion isn't possible
// Use with caution!
const value = "hello" as unknown as number; // Forces assertion through 'unknown'

// More practical example
interface Cat {
  purr(): void;
}

interface Dog {
  bark(): void;
}

// Direct assertion from Cat to Dog would fail
// const dog = cat as Dog; // Error!
// const dog = cat as unknown as Dog; // Works but dangerous
Non-Null Assertion Operator (!)
TypeScript

function processValue(value: string | null | undefined): void {
  // Tell TypeScript we know value is not null/undefined
  const length = value!.length;
  console.log(length);
}

// DOM example
const element = document.getElementById("myElement")!;
element.textContent = "Hello"; // No null check needed

// Better: use proper null checks instead
function safePprocessValue(value: string | null | undefined): void {
  if (value != null) {
    console.log(value.length);
  }
}
satisfies vs Type Assertion
TypeScript

// Type assertion can lose information
const colors1 = {
  red: [255, 0, 0],
  green: "#00ff00",
} as Record<string, string | number[]>;
// colors1.red is now string | number[] — we lost the specific type

// satisfies preserves the inferred type (TypeScript 4.9+)
const colors2 = {
  red: [255, 0, 0],
  green: "#00ff00",
} satisfies Record<string, string | number[]>;
// colors2.red is number[] — type is preserved!
// colors2.green is string — type is preserved!
Reference: TypeScript Type Assertions

Type Guards & Narrowing
Type guards allow TypeScript to narrow the type within a conditional block.

typeof Guards
TypeScript

function padLeft(value: string, padding: string | number): string {
  if (typeof padding === "number") {
    // TypeScript knows padding is number here
    return " ".repeat(padding) + value;
  }
  // TypeScript knows padding is string here
  return padding + value;
}

console.log(padLeft("Hello", 4));      // "    Hello"
console.log(padLeft("Hello", ">>> ")); // ">>> Hello"
instanceof Guards
TypeScript

class Bird {
  fly(): void {
    console.log("Flying...");
  }
}

class Fish {
  swim(): void {
    console.log("Swimming...");
  }
}

function move(animal: Bird | Fish): void {
  if (animal instanceof Bird) {
    animal.fly(); // TypeScript knows it's Bird
  } else {
    animal.swim(); // TypeScript knows it's Fish
  }
}
in Operator
TypeScript

interface Car {
  drive(): void;
  honk(): void;
}

interface Boat {
  sail(): void;
  anchor(): void;
}

function operate(vehicle: Car | Boat): void {
  if ("drive" in vehicle) {
    vehicle.drive(); // Car
    vehicle.honk();
  } else {
    vehicle.sail(); // Boat
    vehicle.anchor();
  }
}
Custom Type Guards (Type Predicates)
TypeScript

interface Cat {
  type: "cat";
  meow(): void;
}

interface Dog {
  type: "dog";
  bark(): void;
}

// Type predicate function
function isCat(animal: Cat | Dog): animal is Cat {
  return animal.type === "cat";
}

function isDog(animal: Cat | Dog): animal is Dog {
  return animal.type === "dog";
}

function interact(animal: Cat | Dog): void {
  if (isCat(animal)) {
    animal.meow(); // TypeScript knows it's Cat
  } else {
    animal.bark(); // TypeScript knows it's Dog
  }
}

// More complex type guard
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value != null;
}

function processValues(values: (string | number | null | undefined)[]): string[] {
  return values
    .filter(isNonNullable)
    .filter(isString)
    .map((s) => s.toUpperCase());
}
Assertion Functions
TypeScript

function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Value is null or undefined");
  }
}

function processInput(input: unknown): void {
  assertIsString(input);
  // TypeScript now knows input is string
  console.log(input.toUpperCase());
}

function getUser(id: number): { name: string } | undefined {
  // ... database lookup
  return id === 1 ? { name: "Alice" } : undefined;
}

const user = getUser(1);
assertIsDefined(user);
console.log(user.name); // No error — TypeScript knows user is defined
Truthiness Narrowing
TypeScript

function printLength(str: string | null | undefined): void {
  if (str) {
    // str is string here (truthy)
    console.log(str.length);
  } else {
    // str is string | null | undefined here
    // Could also be empty string ""
    console.log("No string provided");
  }
}

// Using Boolean as a type guard
const values: (string | null | undefined)[] = ["hello", null, "world", undefined];
const validValues: string[] = values.filter(Boolean) as string[];
Equality Narrowing
TypeScript

function example(x: string | number, y: string | boolean): void {
  if (x === y) {
    // Both must be string (only common type)
    x.toUpperCase(); // OK
    y.toUpperCase(); // OK
  }
}

function checkValue(value: string | null): void {
  if (value !== null) {
    // value is string
    console.log(value.toUpperCase());
  }
}
Reference: TypeScript Narrowing

Utility Types
TypeScript provides several built-in utility types for common type transformations.

Partial<T>
Makes all properties optional.

TypeScript

interface User {
  name: string;
  email: string;
  age: number;
}

function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
}

const user: User = { name: "Alice", email: "alice@example.com", age: 30 };
const updated = updateUser(user, { name: "Alicia" });
// Only name is updated, email and age remain the same
Required<T>
Makes all properties required.

TypeScript

interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

const fullConfig: Required<Config> = {
  host: "localhost",
  port: 3000,
  debug: true,
  // All properties are now required
};
Readonly<T>
Makes all properties readonly.

TypeScript

interface Todo {
  title: string;
  completed: boolean;
}

const todo: Readonly<Todo> = {
  title: "Learn TypeScript",
  completed: false,
};

// todo.completed = true; // Error!
Record<K, V>
Constructs a type with keys of type K and values of type V.

TypeScript

type Fruit = "apple" | "banana" | "cherry";

interface FruitInfo {
  color: string;
  calories: number;
}

const fruits: Record<Fruit, FruitInfo> = {
  apple: { color: "red", calories: 95 },
  banana: { color: "yellow", calories: 105 },
  cherry: { color: "red", calories: 50 },
};

// Dynamic string keys
type PageInfo = Record<string, { title: string; url: string }>;
const pages: PageInfo = {
  home: { title: "Home", url: "/" },
  about: { title: "About", url: "/about" },
};
Pick<T, K>
Creates a type with only the specified properties.

TypeScript

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PublicUser = Pick<User, "id" | "name" | "email">;

const publicUser: PublicUser = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
};
Omit<T, K>
Creates a type without the specified properties.

TypeScript

type UserWithoutPassword = Omit<User, "password">;

const safeUser: UserWithoutPassword = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  createdAt: new Date(),
};

// Omit multiple properties
type BasicUser = Omit<User, "password" | "createdAt">;
Exclude<T, U>
Excludes from a union type all members assignable to U.

TypeScript

type AllColors = "red" | "green" | "blue" | "yellow";
type WarmColors = Exclude<AllColors, "green" | "blue">; // "red" | "yellow"

type NonNullableString = Exclude<string | null | undefined, null | undefined>; // string
Extract<T, U>
Extracts from a union type all members assignable to U.

TypeScript

type AllColors = "red" | "green" | "blue" | "yellow";
type PrimaryColors = Extract<AllColors, "red" | "blue">; // "red" | "blue"

type NumericTypes = Extract<string | number | boolean | bigint, number | bigint>; // number | bigint
NonNullable<T>
Removes null and undefined from a type.

TypeScript

type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string

type MaybeUser = User | null;
type DefiniteUser = NonNullable<MaybeUser>; // User
ReturnType<T>
Extracts the return type of a function type.

TypeScript

function createUser(name: string, age: number) {
  return { name, age, createdAt: new Date() };
}

type NewUser = ReturnType<typeof createUser>;
// { name: string; age: number; createdAt: Date }

type StringReturn = ReturnType<() => string>; // string
type VoidReturn = ReturnType<() => void>;     // void
Parameters<T>
Extracts parameter types as a tuple.

TypeScript

function greet(name: string, age: number, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}! You are ${age}.`;
}

type GreetParams = Parameters<typeof greet>;
// [name: string, age: number, greeting?: string | undefined]

const params: GreetParams = ["Alice", 30, "Hi"];
greet(...params);
ConstructorParameters<T>
Extracts parameter types from a constructor.

TypeScript

class Person {
  constructor(public name: string, public age: number) {}
}

type PersonConstructorParams = ConstructorParameters<typeof Person>;
// [name: string, age: number]
InstanceType<T>
Extracts the instance type of a constructor.

TypeScript

class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

type AnimalInstance = InstanceType<typeof Animal>; // Animal
Awaited<T>
Unwraps the type of a Promise.

TypeScript

type A = Awaited<Promise<string>>;                    // string
type B = Awaited<Promise<Promise<number>>>;            // number
type C = Awaited<boolean | Promise<number>>;           // boolean | number
Uppercase<S>, Lowercase<S>, Capitalize<S>, Uncapitalize<S>
Intrinsic string manipulation types.

TypeScript

type Greeting = "hello, world";
type ShoutyGreeting = Uppercase<Greeting>;       // "HELLO, WORLD"
type QuietGreeting = Lowercase<"HELLO">;          // "hello"
type CapGreeting = Capitalize<"hello">;           // "Hello"
type UncapGreeting = Uncapitalize<"Hello">;       // "hello"
Reference: TypeScript Utility Types

Mapped Types
Mapped types allow you to create new types by transforming properties of existing types.

Basic Mapped Type
TypeScript

// Making all properties optional (like Partial)
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};

// Making all properties readonly (like Readonly)
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Making all properties required
type MyRequired<T> = {
  [P in keyof T]-?: T[P]; // -? removes optionality
};

// Making all properties mutable (remove readonly)
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface User {
  readonly id: number;
  name: string;
  email?: string;
}

type MutableUser = Mutable<User>;
// { id: number; name: string; email?: string }
Mapped Type with Transformation
TypeScript

// Nullable version of all properties
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Wrap each property in a Promise
type Promisified<T> = {
  [P in keyof T]: Promise<T[P]>;
};

// Getter methods for each property
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

// Setter methods for each property
type Setters<T> = {
  [P in keyof T as `set${Capitalize<string & P>}`]: (value: T[P]) => void;
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }

type PersonSetters = Setters<Person>;
// { setName: (value: string) => void; setAge: (value: number) => void }
Key Remapping (via as)
TypeScript

// Remove specific properties
type RemoveKind<T> = {
  [P in keyof T as Exclude<P, "kind">]: T[P];
};

interface Circle {
  kind: "circle";
  radius: number;
}

type KindlessCircle = RemoveKind<Circle>;
// { radius: number }

// Only keep string properties
type OnlyStringProperties<T> = {
  [P in keyof T as T[P] extends string ? P : never]: T[P];
};

interface Mixed {
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}

type StringProps = OnlyStringProperties<Mixed>;
// { name: string; email: string }

// Event map
type EventMap<T> = {
  [P in keyof T as `on${Capitalize<string & P>}Change`]: (value: T[P]) => void;
};

type PersonEvents = EventMap<Person>;
// { onNameChange: (value: string) => void; onAgeChange: (value: number) => void }
Reference: TypeScript Mapped Types

Conditional Types
Conditional types select one of two possible types based on a condition.

Basic Conditional Type
TypeScript

// Syntax: T extends U ? X : Y
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"
type C = IsString<"hello">; // "yes"

// Practical example
type IdType<T> = T extends string ? string : number;

function processId<T extends string | number>(id: T): IdType<T> {
  // Implementation
  return id as IdType<T>;
}
Distributive Conditional Types
TypeScript

// When T is a union, the conditional type distributes over each member
type ToArray<T> = T extends any ? T[] : never;

type StringOrNumberArray = ToArray<string | number>;
// string[] | number[] (distributed)

// Prevent distribution by wrapping in tuple
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type MixedArray = ToArrayNonDist<string | number>;
// (string | number)[] (not distributed)
Conditional Type with never
TypeScript

// Filter out types
type NonString<T> = T extends string ? never : T;

type Result = NonString<string | number | boolean>;
// number | boolean

// This is essentially how Exclude works
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;
Nested Conditional Types
TypeScript

type TypeName<T> = T extends string
  ? "string"
  : T extends number
  ? "number"
  : T extends boolean
  ? "boolean"
  : T extends undefined
  ? "undefined"
  : T extends Function
  ? "function"
  : "object";

type T1 = TypeName<string>;     // "string"
type T2 = TypeName<42>;         // "number"
type T3 = TypeName<true>;       // "boolean"
type T4 = TypeName<() => void>; // "function"
type T5 = TypeName<string[]>;   // "object"
Conditional Types with Generics
TypeScript

type Flatten<T> = T extends Array<infer U> ? U : T;

type Str = Flatten<string[]>;   // string
type Num = Flatten<number>;     // number

// Deep flatten
type DeepFlatten<T> = T extends Array<infer U> ? DeepFlatten<U> : T;

type Deep = DeepFlatten<number[][][]>; // number
Reference: TypeScript Conditional Types

Template Literal Types
Template literal types build on string literal types to create complex string patterns.

Basic Template Literals
TypeScript

type World = "world";
type Greeting = `hello ${World}`; // "hello world"

// Union expansion
type Color = "red" | "green" | "blue";
type Size = "small" | "medium" | "large";

type ColoredSize = `${Color}-${Size}`;
// "red-small" | "red-medium" | "red-large" | "green-small" | ... (9 combinations)
Event Handler Types
TypeScript

type EventName = "click" | "scroll" | "mousemove";
type EventHandler = `on${Capitalize<EventName>}`;
// "onClick" | "onScroll" | "onMousemove"

interface EventHandlers {
  onClick: (event: MouseEvent) => void;
  onScroll: (event: Event) => void;
  onMousemove: (event: MouseEvent) => void;
}
CSS-like Types
TypeScript

type CSSUnit = "px" | "em" | "rem" | "%" | "vh" | "vw";
type CSSValue = `${number}${CSSUnit}`;

const width: CSSValue = "100px";    // OK
const height: CSSValue = "50vh";    // OK
// const bad: CSSValue = "100";     // Error!

type HexDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "a" | "b" | "c" | "d" | "e" | "f";
type HexColor = `#${string}`; // Simplified hex color
Pattern Matching with Template Literals
TypeScript

type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
    : T extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string }
    : {};

type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }
String Manipulation with Template Literals
TypeScript

// Convert camelCase to snake_case (simplified)
type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? "_" : ""}${Lowercase<T>}${CamelToSnakeCase<U>}`
  : S;

type Snake = CamelToSnakeCase<"helloWorld">; // "hello_world"

// Get/set property names
type Getter<T extends string> = `get${Capitalize<T>}`;
type Setter<T extends string> = `set${Capitalize<T>}`;

type NameGetter = Getter<"name">;   // "getName"
type AgeSetter = Setter<"age">;     // "setAge"
Reference: TypeScript Template Literal Types

Keyof & Typeof Operators
keyof Operator
Creates a union type of all property names of a type.

TypeScript

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type UserKeys = keyof User; // "id" | "name" | "email" | "age"

// Use with generics for type-safe property access
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = { id: 1, name: "Alice", email: "alice@example.com", age: 30 };
const name = getProperty(user, "name");  // string
const age = getProperty(user, "age");    // number
// getProperty(user, "phone");           // Error!

// keyof with index signatures
interface StringMap {
  [key: string]: number;
}
type StringMapKeys = keyof StringMap; // string | number (number keys are valid too)

// keyof with mapped types
type OptionalFlags<T> = {
  [K in keyof T]?: boolean;
};

type UserFlags = OptionalFlags<User>;
// { id?: boolean; name?: boolean; email?: boolean; age?: boolean }
typeof Operator
Gets the type of a JavaScript value.

TypeScript

// Basic typeof
const message = "Hello, World!";
type MessageType = typeof message; // string

const config = {
  host: "localhost",
  port: 3000,
  debug: true,
  database: {
    name: "mydb",
    connection: "postgresql://localhost:5432",
  },
};

type Config = typeof config;
/*
{
  host: string;
  port: number;
  debug: boolean;
  database: {
    name: string;
    connection: string;
  };
}
*/

// typeof with const assertion for literal types
const COLORS = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
} as const;

type Colors = typeof COLORS;
/*
{
  readonly red: "#ff0000";
  readonly green: "#00ff00";
  readonly blue: "#0000ff";
}
*/

type ColorName = keyof typeof COLORS; // "red" | "green" | "blue"
type ColorValue = (typeof COLORS)[ColorName]; // "#ff0000" | "#00ff00" | "#0000ff"

// typeof with functions
function createPoint(x: number, y: number) {
  return { x, y };
}

type Point = ReturnType<typeof createPoint>; // { x: number; y: number }
type PointParams = Parameters<typeof createPoint>; // [x: number, y: number]

// typeof with enums
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

type DirectionType = typeof Direction;
// The enum object type
type DirectionValues = `${Direction}`;
// "UP" | "DOWN" | "LEFT" | "RIGHT"
Combining keyof and typeof
TypeScript

const routes = {
  home: "/",
  about: "/about",
  users: "/users",
  settings: "/settings",
} as const;

type RouteName = keyof typeof routes;        // "home" | "about" | "users" | "settings"
type RoutePath = (typeof routes)[RouteName]; // "/" | "/about" | "/users" | "/settings"

function navigate(route: RouteName): void {
  const path = routes[route];
  console.log(`Navigating to ${path}`);
}

navigate("home");    // OK
// navigate("login"); // Error!
Reference: TypeScript Keyof, TypeScript Typeof

Indexed Access Types
Access the type of a specific property within a type.

TypeScript

interface User {
  id: number;
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
    country: string;
    zip: string;
  };
  orders: {
    id: number;
    total: number;
    items: string[];
  }[];
}

// Access nested types
type UserId = User["id"];           // number
type UserName = User["name"];       // string
type UserAddress = User["address"]; // { street: string; city: string; ... }
type UserCity = User["address"]["city"]; // string

// Access array element type
type UserOrder = User["orders"][number]; // { id: number; total: number; items: string[] }
type OrderItem = User["orders"][number]["items"][number]; // string

// Union of property types
type UserIdOrName = User["id" | "name"]; // number | string

// All property types
type AllUserTypes = User[keyof User]; // number | string | {...} | {...}[]

// With arrays
const roles = ["admin", "editor", "viewer"] as const;
type Role = (typeof roles)[number]; // "admin" | "editor" | "viewer"

// Practical example
interface ApiResponses {
  "/users": User[];
  "/users/:id": User;
  "/posts": { id: number; title: string; body: string }[];
}

function fetchApi<T extends keyof ApiResponses>(url: T): Promise<ApiResponses[T]> {
  return fetch(url).then((res) => res.json());
}

// Return type is automatically inferred
const users = fetchApi("/users");      // Promise<User[]>
const user = fetchApi("/users/:id");   // Promise<User>
Reference: TypeScript Indexed Access Types

Modules & Namespaces
ES Modules (Recommended)
TypeScript

// math.ts — Named exports
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export const PI = 3.14159;

export interface MathResult {
  value: number;
  operation: string;
}

// Default export
export default class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
TypeScript

// app.ts — Importing
import Calculator, { add, subtract, PI, MathResult } from "./math";

// Import all
import * as MathModule from "./math";
MathModule.add(1, 2);

// Rename imports
import { add as addNumbers } from "./math";

// Type-only imports (erased at compile time)
import type { MathResult } from "./math";
import { type MathResult as MR } from "./math";

// Dynamic imports
async function loadModule() {
  const math = await import("./math");
  console.log(math.add(1, 2));
}
Re-exports
TypeScript

// index.ts — barrel file
export { add, subtract } from "./math";
export { default as Calculator } from "./math";
export type { MathResult } from "./math";

// Re-export everything
export * from "./math";
export * as Math from "./math";
Namespaces (Legacy)
TypeScript

namespace Validation {
  export interface StringValidator {
    isValid(str: string): boolean;
  }

  export class LettersOnlyValidator implements StringValidator {
    isValid(str: string): boolean {
      return /^[A-Za-z]+$/.test(str);
    }
  }

  export class ZipCodeValidator implements StringValidator {
    isValid(str: string): boolean {
      return /^\d{5}(-\d{4})?$/.test(str);
    }
  }

  // Not exported — internal to namespace
  const numberRegexp = /^[0-9]+$/;
}

// Usage
const lettersValidator = new Validation.LettersOnlyValidator();
console.log(lettersValidator.isValid("Hello")); // true

// Nested namespaces
namespace App {
  export namespace Models {
    export interface User {
      name: string;
    }
  }

  export namespace Services {
    export class UserService {
      getUser(): Models.User {
        return { name: "Alice" };
      }
    }
  }
}
Note: ES Modules are preferred over namespaces in modern TypeScript. Namespaces are primarily useful for organizing types in declaration files.

Reference: TypeScript Modules

Declaration Files
Declaration files (.d.ts) provide type information for JavaScript libraries.

Basic Declaration File
TypeScript

// types/my-library.d.ts

// Declare a module
declare module "my-library" {
  export function doSomething(input: string): number;
  export function doSomethingElse(input: number): string;

  export interface Config {
    apiKey: string;
    timeout?: number;
  }

  export class Client {
    constructor(config: Config);
    connect(): Promise<void>;
    disconnect(): void;
  }

  export default Client;
}
Ambient Declarations
TypeScript

// globals.d.ts

// Declare global variables
declare const API_URL: string;
declare const VERSION: string;
declare const IS_PRODUCTION: boolean;

// Declare global functions
declare function logEvent(event: string, data?: object): void;

// Augment existing interfaces
interface Window {
  analytics: {
    track(event: string, properties?: object): void;
    identify(userId: string): void;
  };
}

// Augment Node.js process.env
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT?: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
  }
}
Module Augmentation
TypeScript

// Extending Express Request type
import "express";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      name: string;
      role: string;
    };
    sessionId?: string;
  }
}

// Extending a library
declare module "lodash" {
  interface LoDashStatic {
    customMethod(input: string): string;
  }
}
Wildcard Module Declarations
TypeScript

// Declare modules for file types
declare module "*.css" {
  const styles: { [className: string]: string };
  export default styles;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare module "*.png" {
  const value: string;
  export default value;
}
Writing Declaration Files for JavaScript
TypeScript

// For a JavaScript file: utils.js
// function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
// function range(start, end) { ... }

// utils.d.ts
export declare function capitalize(str: string): string;
export declare function range(start: number, end: number): number[];

export interface UtilOptions {
  locale?: string;
  trim?: boolean;
}
Reference: TypeScript Declaration Files, DefinitelyTyped

Decorators
Decorators are special declarations that attach metadata to classes, methods, properties, or parameters. TypeScript 5 supports both legacy (experimental) and the new ECMAScript decorators.

Note: For legacy decorators, enable "experimentalDecorators": true in tsconfig.json.

Class Decorators
TypeScript

// Legacy decorator
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

function logger(constructor: Function) {
  console.log(`Creating instance of ${constructor.name}`);
}

@sealed
@logger
class Greeter {
  greeting: string;

  constructor(message: string) {
    this.greeting = message;
  }

  greet() {
    return `Hello, ${this.greeting}`;
  }
}
Decorator Factories
TypeScript

function color(value: string) {
  return function (constructor: Function) {
    constructor.prototype.color = value;
  };
}

function enumerable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.enumerable = value;
  };
}

@color("red")
class Car {
  brand: string;

  constructor(brand: string) {
    this.brand = brand;
  }

  @enumerable(false)
  getInfo() {
    return `${this.brand}`;
  }
}
Method Decorators
TypeScript

function log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with args: ${JSON.stringify(args)}`);
    const result = originalMethod.apply(this, args);
    console.log(`${propertyKey} returned: ${result}`);
    return result;
  };

  return descriptor;
}

function measureTime(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();
    console.log(`${propertyKey} took ${(end - start).toFixed(2)}ms`);
    return result;
  };

  return descriptor;
}

class MathService {
  @log
  @measureTime
  multiply(a: number, b: number): number {
    return a * b;
  }
}

const math = new MathService();
math.multiply(3, 4);
Property Decorators
TypeScript

function required(target: any, propertyKey: string) {
  let value: any;

  const getter = () => value;
  const setter = (newValue: any) => {
    if (newValue === undefined || newValue === null || newValue === "") {
      throw new Error(`${propertyKey} is required`);
    }
    value = newValue;
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
}

class UserForm {
  @required
  name!: string;

  @required
  email!: string;
}
Parameter Decorators
TypeScript

function validate(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  const existingValidations: number[] =
    Reflect.getOwnMetadata("validate", target, propertyKey) || [];
  existingValidations.push(parameterIndex);
  Reflect.defineMetadata("validate", existingValidations, target, propertyKey);
}

class UserService {
  createUser(@validate name: string, @validate email: string): void {
    console.log(`Creating user: ${name} (${email})`);
  }
}
TC39 Stage 3 Decorators (TypeScript 5.0+)
TypeScript

// New decorator syntax — no experimentalDecorators flag needed
function loggedMethod<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  function replacementMethod(this: This, ...args: Args): Return {
    console.log(`LOG: Entering method '${methodName}'.`);
    const result = target.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`);
    return result;
  }

  return replacementMethod;
}

class MyClass {
  @loggedMethod
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}
Reference: TypeScript Decorators, TC39 Decorators Proposal

Mixins
Mixins allow you to compose classes from reusable components.

Mixin Pattern
TypeScript

// Constructor type
type Constructor<T = {}> = new (...args: any[]) => T;

// Mixin: Timestamped
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt = new Date();

    touch() {
      this.updatedAt = new Date();
    }
  };
}

// Mixin: Activatable
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;

    activate() {
      this.isActive = true;
    }

    deactivate() {
      this.isActive = false;
    }
  };
}

// Mixin: Taggable
function Taggable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    tags: string[] = [];

    addTag(tag: string) {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag);
      }
    }

    removeTag(tag: string) {
      this.tags = this.tags.filter((t) => t !== tag);
    }

    hasTag(tag: string): boolean {
      return this.tags.includes(tag);
    }
  };
}

// Base class
class User {
  constructor(public name: string, public email: string) {}
}

// Compose mixins
const TimestampedUser = Timestamped(User);
const ActivatableTimestampedUser = Activatable(Timestamped(User));
const FullUser = Taggable(Activatable(Timestamped(User)));

// Usage
const user = new FullUser("Alice", "alice@example.com");
user.activate();
user.addTag("admin");
user.touch();

console.log(user.name);      // "Alice"
console.log(user.isActive);  // true
console.log(user.tags);      // ["admin"]
console.log(user.createdAt); // Date
Constrained Mixins
TypeScript

// Require the base class to have specific properties
interface HasId {
  id: number;
}

function Serializable<TBase extends Constructor<HasId>>(Base: TBase) {
  return class extends Base {
    serialize(): string {
      return JSON.stringify(this);
    }

    toJSON() {
      return { ...this };
    }
  };
}

class Entity {
  constructor(public id: number) {}
}

const SerializableEntity = Serializable(Entity);
const entity = new SerializableEntity(1);
console.log(entity.serialize()); // {"id":1}
Reference: TypeScript Mixins

Type Compatibility & Structural Typing
TypeScript uses structural typing (duck typing). Types are compatible if they have the same structure, regardless of their names.

Basic Structural Typing
TypeScript

interface Point {
  x: number;
  y: number;
}

class VirtualPoint {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// Works because VirtualPoint has the same structure as Point
const point: Point = new VirtualPoint(1, 2);

// Extra properties are fine (subtype is assignable to supertype)
interface Point3D {
  x: number;
  y: number;
  z: number;
}

const point3d: Point3D = { x: 1, y: 2, z: 3 };
const point2d: Point = point3d; // OK — Point3D has all properties of Point
// const bad: Point3D = point2d; // Error — missing 'z'
Function Compatibility
TypeScript

// Parameter compatibility
type Handler = (event: MouseEvent) => void;
type GeneralHandler = (event: Event) => void;

let mouseHandler: Handler = (e: MouseEvent) => console.log(e.clientX);
let generalHandler: GeneralHandler = (e: Event) => console.log(e.type);

// generalHandler = mouseHandler; // Error — not safe
mouseHandler = generalHandler;    // OK — contravariance (unless strictFunctionTypes)

// Fewer parameters are OK
type Callback = (a: number, b: number, c: number) => void;

const cb1: Callback = () => {};           // OK
const cb2: Callback = (a) => {};          // OK
const cb3: Callback = (a, b) => {};       // OK
const cb4: Callback = (a, b, c) => {};    // OK

// Return type compatibility
type StringReturner = () => string;
type AnyReturner = () => any;

let sr: StringReturner = () => "hello";
let ar: AnyReturner = () => 42;

ar = sr; // OK — string is assignable to any
// sr = ar; // Error in strict mode
Freshness (Strict Object Literal Checking)
TypeScript

interface Options {
  width: number;
  height: number;
}

// Direct object literal — strict checking
// const opts: Options = { width: 100, height: 200, depth: 50 }; // Error!

// Via variable — no strict checking
const config = { width: 100, height: 200, depth: 50 };
const opts: Options = config; // OK — extra properties allowed
Reference: TypeScript Type Compatibility

Symbols
Basic Symbols
TypeScript

// Create unique symbols
const sym1 = Symbol("description");
const sym2 = Symbol("description");
console.log(sym1 === sym2); // false — each symbol is unique

// Use as property keys
const nameKey = Symbol("name");
const ageKey = Symbol("age");

const person = {
  [nameKey]: "Alice",
  [ageKey]: 30,
  visible: "This is visible",
};

console.log(person[nameKey]); // "Alice"

// Symbols are not enumerated in for...in
for (const key in person) {
  console.log(key); // Only "visible"
}

// But accessible via Object.getOwnPropertySymbols
const symbols = Object.getOwnPropertySymbols(person);
console.log(symbols); // [Symbol(name), Symbol(age)]
Unique Symbols
TypeScript

// unique symbol is a subtype of symbol
const uniqueSym: unique symbol = Symbol("unique");

interface WithSymbol {
  [uniqueSym]: string;
}

const obj: WithSymbol = {
  [uniqueSym]: "hello",
};
Well-Known Symbols
TypeScript

class Collection {
  private items: number[] = [];

  add(item: number): void {
    this.items.push(item);
  }

  // Make iterable
  [Symbol.iterator](): Iterator<number> {
    let index = 0;
    const items = this.items;

    return {
      next(): IteratorResult<number> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }

  // Custom string representation
  [Symbol.toPrimitive](hint: string): string | number {
    if (hint === "number") {
      return this.items.length;
    }
    return `Collection(${this.items.join(", ")})`;
  }
}

const collection = new Collection();
collection.add(1);
collection.add(2);
collection.add(3);

for (const item of collection) {
  console.log(item); // 1, 2, 3
}
Reference: MDN Symbols

Iterators & Generators
Iterators
TypeScript

// Implementing the Iterable interface
class Range implements Iterable<number> {
  constructor(private start: number, private end: number) {}

  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const end = this.end;

    return {
      next(): IteratorResult<number> {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}

const range = new Range(1, 5);
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// Spread into array
const numbers = [...new Range(1, 10)]; // [1, 2, 3, ..., 10]

// Destructuring
const [first, second, third] = new Range(10, 20);
console.log(first, second, third); // 10, 11, 12
Generators
TypeScript

// Basic generator
function* numberGenerator(): Generator<number, void, unknown> {
  yield 1;
  yield 2;
  yield 3;
}

const gen = numberGenerator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }

// Infinite generator
function* fibonacci(): Generator<number, never, unknown> {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// Take first n values
function take<T>(generator: Generator<T>, n: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    const { value, done } = generator.next();
    if (done) break;
    result.push(value!);
  }
  return result;
}

console.log(take(fibonacci(), 10)); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// Generator with input values
function* accumulator(): Generator<number, void, number> {
  let total = 0;
  while (true) {
    const value = yield total;
    total += value;
  }
}

const acc = accumulator();
acc.next();         // { value: 0, done: false } — prime the generator
acc.next(10);       // { value: 10, done: false }
acc.next(20);       // { value: 30, done: false }
acc.next(5);        // { value: 35, done: false }

// yield* delegation
function* innerGenerator(): Generator<string> {
  yield "a";
  yield "b";
}

function* outerGenerator(): Generator<string | number> {
  yield 1;
  yield* innerGenerator();
  yield 2;
}

console.log([...outerGenerator()]); // [1, "a", "b", 2]
Async Generators
TypeScript

async function* fetchPages(url: string): AsyncGenerator<any[], void, unknown> {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();

    if (data.length === 0) {
      hasMore = false;
    } else {
      yield data;
      page++;
    }
  }
}

// Usage
async function processAllPages() {
  for await (const page of fetchPages("https://api.example.com/items")) {
    console.log(`Processing ${page.length} items`);
  }
}
Reference: TypeScript Iterators and Generators

Async/Await & Promises
Promises
TypeScript

// Creating a promise
function fetchUser(id: number): Promise<{ name: string; email: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ name: "Alice", email: "alice@example.com" });
      } else {
        reject(new Error("Invalid user ID"));
      }
    }, 1000);
  });
}

// Using promise
fetchUser(1)
  .then((user) => console.log(user.name))
  .catch((error) => console.error(error.message));

// Promise.all — run in parallel, wait for all
async function fetchMultipleUsers(): Promise<void> {
  const [user1, user2, user3] = await Promise.all([
    fetchUser(1),
    fetchUser(2),
    fetchUser(3),
  ]);
  console.log(user1, user2, user3);
}

// Promise.race — first to resolve/reject wins
const fastest = await Promise.race([
  fetchUser(1),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 5000)
  ),
]);

// Promise.allSettled — wait for all, don't fail fast
const results = await Promise.allSettled([
  fetchUser(1),
  fetchUser(-1), // This will reject
  fetchUser(3),
]);

results.forEach((result) => {
  if (result.status === "fulfilled") {
    console.log("Success:", result.value);
  } else {
    console.log("Failed:", result.reason);
  }
});

// Promise.any — first to succeed wins
const firstSuccess = await Promise.any([
  fetchUser(-1), // Rejects
  fetchUser(2),  // Resolves
  fetchUser(3),  // Resolves
]);
Async/Await
TypeScript

// Async function
async function getUser(id: number): Promise<{ name: string }> {
  const response = await fetch(`https://api.example.com/users/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Error handling with try/catch
async function handleUser(id: number): Promise<void> {
  try {
    const user = await getUser(id);
    console.log(`User: ${user.name}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
  } finally {
    console.log("Operation complete");
  }
}

// Sequential vs Parallel execution
async function sequential(): Promise<void> {
  const user1 = await fetchUser(1); // Wait for this
  const user2 = await fetchUser(2); // Then this
  // Total: ~2 seconds
}

async function parallel(): Promise<void> {
  const [user1, user2] = await Promise.all([
    fetchUser(1), // Start both at once
    fetchUser(2),
  ]);
  // Total: ~1 second
}

// Async iteration
async function processStream(stream: ReadableStream<Uint8Array>): Promise<void> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(`Received ${value.length} bytes`);
    }
  } finally {
    reader.releaseLock();
  }
}

// Typed async function as parameter
type AsyncProcessor<T> = (item: T) => Promise<void>;

async function processItems<T>(
  items: T[],
  processor: AsyncProcessor<T>
): Promise<void> {
  for (const item of items) {
    await processor(item);
  }
}

// Retry pattern
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Should not reach here");
}
Reference: MDN async/await, TypeScript Handbook

Triple-Slash Directives
Triple-slash directives are single-line comments containing XML tags used as compiler directives.

TypeScript

/// <reference path="./global.d.ts" />
/// <reference types="node" />
/// <reference lib="es2020" />
/// <reference no-default-lib="true" />

// reference path — include another file
/// <reference path="./types/custom.d.ts" />

// reference types — include a @types package
/// <reference types="jest" />
/// <reference types="node" />

// reference lib — include a built-in lib
/// <reference lib="es2020.promise" />
/// <reference lib="dom" />
Note: In most modern projects, tsconfig.json is used instead of triple-slash directives.

Reference: TypeScript Triple-Slash Directives

tsconfig.json Configuration
Complete Example
JSON

{
  "compilerOptions": {
    // --- Language and Environment ---
    "target": "ES2022",                    // ECMAScript target version
    "lib": ["ES2022", "DOM", "DOM.Iterable"], // Library files to include
    "jsx": "react-jsx",                    // JSX support
    "experimentalDecorators": true,        // Legacy decorators
    "emitDecoratorMetadata": true,         // Decorator metadata

    // --- Modules ---
    "module": "NodeNext",                  // Module system
    "moduleResolution": "NodeNext",        // Module resolution strategy
    "baseUrl": "./src",                    // Base directory for paths
    "paths": {                             // Path aliases
      "@/*": ["./*"],
      "@components/*": ["./components/*"],
      "@utils/*": ["./utils/*"]
    },
    "rootDir": "./src",                    // Root directory of source files
    "resolveJsonModule": true,             // Allow importing .json files
    "allowImportingTsExtensions": false,   // Allow .ts extensions in imports
    "esModuleInterop": true,               // CommonJS/ES Module interop

    // --- Type Checking (Strict) ---
    "strict": true,                        // Enable all strict checks
    "strictNullChecks": true,              // null and undefined are distinct types
    "strictFunctionTypes": true,           // Strict function parameter checking
    "strictBindCallApply": true,           // Strict bind, call, apply
    "strictPropertyInitialization": true,  // Properties must be initialized
    "noImplicitAny": true,                 // Error on implied 'any'
    "noImplicitThis": true,                // Error on 'this' with implied 'any'
    "alwaysStrict": true,                  // Parse in strict mode

    // --- Additional Checks ---
    "noUnusedLocals": true,                // Error on unused locals
    "noUnusedParameters": true,            // Error on unused parameters
    "noImplicitReturns": true,             // Error when not all paths return
    "noFallthroughCasesInSwitch": true,    // Error on fall-through switch cases
    "noUncheckedIndexedAccess": true,      // Add undefined to index signatures
    "noImplicitOverride": true,            // Require 'override' keyword
    "exactOptionalPropertyTypes": true,    // Differentiate optional vs undefined
    "forceConsistentCasingInFileNames": true, // Case-sensitive file names

    // --- Emit ---
    "outDir": "./dist",                    // Output directory
    "declaration": true,                   // Generate .d.ts files
    "declarationDir": "./dist/types",      // Output dir for declarations
    "declarationMap": true,                // Sourcemaps for declarations
    "sourceMap": true,                     // Generate source maps
    "removeComments": true,                // Remove comments from output
    "noEmit": false,                       // Don't emit output
    "noEmitOnError": true,                 // Don't emit if errors
    "importHelpers": true,                 // Use tslib helpers
    "downlevelIteration": true,            // Full support for iterables

    // --- Interop ---
    "isolatedModules": true,               // Each file is a separate module
    "allowSyntheticDefaultImports": true,  // Allow default imports from modules
    "skipLibCheck": true,                  // Skip type checking .d.ts files
    "verbatimModuleSyntax": false          // Strict ESM/CJS
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "references": [
    { "path": "./tsconfig.node.json" }     // Project references
  ]
}
Common Configurations by Project Type
Node.js Project
JSON

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  }
}
React Project
JSON

{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
Reference: TypeScript tsconfig.json, TSConfig Reference

Strict Mode Options
Understanding each strict mode option individually.

TypeScript

// --- strictNullChecks ---
// Without: string can be null
// With: must explicitly handle null
function getLength(str: string | null): number {
  // return str.length; // Error with strictNullChecks!
  return str?.length ?? 0; // Safe
}

// --- noImplicitAny ---
// Without: parameters default to 'any'
// With: must annotate parameters
// function process(data) {}        // Error!
function process(data: string) {} // OK

// --- strictFunctionTypes ---
// Enables contravariant parameter checking
interface Animal { name: string; }
interface Dog extends Animal { breed: string; }

type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

let animalHandler: AnimalHandler = (a) => console.log(a.name);
let dogHandler: DogHandler = (d) => console.log(d.breed);

// animalHandler = dogHandler; // Error with strictFunctionTypes!

// --- strictPropertyInitialization ---
class User {
  name: string;        // Error! Not definitely assigned
  name2!: string;      // OK — definite assignment assertion
  age: number = 0;     // OK — initialized

  constructor(name: string) {
    this.name = name;
  }
}

// --- noUncheckedIndexedAccess ---
interface StringMap {
  [key: string]: string;
}

const map: StringMap = { a: "hello" };
// With noUncheckedIndexedAccess:
const value = map["b"]; // type: string | undefined
if (value !== undefined) {
  console.log(value.toUpperCase()); // Safe
}

// --- exactOptionalPropertyTypes ---
interface Settings {
  theme?: "light" | "dark";
}

const settings: Settings = {};
// settings.theme = undefined; // Error with exactOptionalPropertyTypes!
delete settings.theme;         // OK — properly removes the property

// --- noImplicitOverride ---
class Base {
  greet() {
    console.log("Hello from Base");
  }
}

class Derived extends Base {
  override greet() {        // Must use 'override' keyword
    console.log("Hello from Derived");
  }
}
Reference: TypeScript Strict Mode

Discriminated Unions
Also known as "tagged unions" or "algebraic data types." They use a common property (discriminant) to narrow types.

TypeScript

// The discriminant property is 'type'
interface Circle {
  type: "circle";
  radius: number;
}

interface Square {
  type: "square";
  sideLength: number;
}

interface Triangle {
  type: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Square | Triangle;

function calculateArea(shape: Shape): number {
  switch (shape.type) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.sideLength ** 2;
    case "triangle":
      return 0.5 * shape.base * shape.height;
    default:
      // Exhaustiveness check
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}

function describeShape(shape: Shape): string {
  switch (shape.type) {
    case "circle":
      return `Circle with radius ${shape.radius}`;
    case "square":
      return `Square with side ${shape.sideLength}`;
    case "triangle":
      return `Triangle with base ${shape.base} and height ${shape.height}`;
  }
}

// Usage
const shapes: Shape[] = [
  { type: "circle", radius: 5 },
  { type: "square", sideLength: 10 },
  { type: "triangle", base: 8, height: 6 },
];

shapes.forEach((shape) => {
  console.log(`${describeShape(shape)} — Area: ${calculateArea(shape).toFixed(2)}`);
});
Real-World Example: State Management
TypeScript

// Action types for a reducer
interface LoadingAction {
  type: "LOADING";
}

interface SuccessAction<T> {
  type: "SUCCESS";
  payload: T;
}

interface ErrorAction {
  type: "ERROR";
  error: string;
}

type Action<T> = LoadingAction | SuccessAction<T> | ErrorAction;

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return { data: action.payload, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
  }
}
Result Type Pattern
TypeScript

type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: "Division by zero" };
  }
  return { success: true, data: a / b };
}

const result = divide(10, 2);
if (result.success) {
  console.log(`Result: ${result.data}`); // TypeScript knows data exists
} else {
  console.log(`Error: ${result.error}`); // TypeScript knows error exists
}
Reference: TypeScript Discriminated Unions

Overloading
Function Overloading
TypeScript

// Overload signatures
function createElement(tag: "a"): HTMLAnchorElement;
function createElement(tag: "canvas"): HTMLCanvasElement;
function createElement(tag: "input"): HTMLInputElement;
function createElement(tag: "table"): HTMLTableElement;
function createElement(tag: string): HTMLElement;

// Implementation signature
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

const anchor = createElement("a");       // HTMLAnchorElement
const canvas = createElement("canvas");  // HTMLCanvasElement
const input = createElement("input");    // HTMLInputElement
const div = createElement("div");        // HTMLElement

// Practical overloading example
function processInput(input: string): string;
function processInput(input: number): number;
function processInput(input: boolean): boolean;
function processInput(input: string | number | boolean): string | number | boolean {
  if (typeof input === "string") {
    return input.trim().toLowerCase();
  }
  if (typeof input === "number") {
    return Math.round(input * 100) / 100;
  }
  return !input;
}

const str = processInput("  Hello  ");  // string
const num = processInput(3.14159);       // number
const bool = processInput(true);         // boolean
Method Overloading in Classes
TypeScript

class DataStore {
  private data: Map<string, any> = new Map();

  // Overload signatures
  get(key: string): any;
  get(key: string, defaultValue: string): string;
  get(key: string, defaultValue: number): number;

  // Implementation
  get(key: string, defaultValue?: any): any {
    return this.data.get(key) ?? defaultValue;
  }

  set(key: string, value: string): void;
  set(key: string, value: number): void;
  set(key: string, value: any): void {
    this.data.set(key, value);
  }
}

const store = new DataStore();
store.set("name", "Alice");
store.set("age", 30);

const name = store.get("name", "Unknown"); // string
const age = store.get("age", 0);           // number
Constructor Overloading
TypeScript

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number);
  constructor(coords: { x: number; y: number });
  constructor(xOrCoords: number | { x: number; y: number }, y?: number) {
    if (typeof xOrCoords === "object") {
      this.x = xOrCoords.x;
      this.y = xOrCoords.y;
    } else {
      this.x = xOrCoords;
      this.y = y!;
    }
  }
}

const p1 = new Point(1, 2);
const p2 = new Point({ x: 3, y: 4 });
Reference: TypeScript Function Overloads

Infer Keyword
The infer keyword is used within conditional types to infer (extract) a type from another type.

Basic Inference
TypeScript

// Infer return type of a function
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type A = MyReturnType<() => string>;              // string
type B = MyReturnType<(x: number) => boolean>;    // boolean
type C = MyReturnType<() => Promise<number>>;     // Promise<number>

// Infer parameter types
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

type D = MyParameters<(a: string, b: number) => void>; // [a: string, b: number]
Inferring from Generic Types
TypeScript

// Unwrap Promise
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type E = UnwrapPromise<Promise<string>>;   // string
type F = UnwrapPromise<Promise<number[]>>; // number[]
type G = UnwrapPromise<string>;            // string (not a promise)

// Deep unwrap Promise
type DeepUnwrapPromise<T> = T extends Promise<infer U>
  ? DeepUnwrapPromise<U>
  : T;

type H = DeepUnwrapPromise<Promise<Promise<Promise<string>>>>; // string

// Unwrap Array
type Flatten<T> = T extends Array<infer U> ? Flatten<U> : T;

type I = Flatten<number[][][]>;  // number
type J = Flatten<string[]>;      // string
Advanced Infer Patterns
TypeScript

// Extract first and last elements of a tuple
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type K = First<[1, 2, 3]>;   // 1
type L = Last<[1, 2, 3]>;    // 3

// Extract first argument
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any
  ? F
  : never;

type M = FirstArg<(name: string, age: number) => void>; // string

// Infer from template literal
type ExtractDomain<T extends string> = T extends `https://${infer Domain}/${string}`
  ? Domain
  : never;

type N = ExtractDomain<"https://example.com/path">; // "example.com"

// Infer constructor instance type
type GetInstanceType<T> = T extends new (...args: any[]) => infer I ? I : never;

class MyClass {
  name = "test";
}

type O = GetInstanceType<typeof MyClass>; // MyClass

// Infer with constraints (TypeScript 4.7+)
type FirstString<T> = T extends [infer S extends string, ...unknown[]]
  ? S
  : never;

type P = FirstString<["hello", 42]>;  // "hello"
type Q = FirstString<[42, "hello"]>;  // never
Reference: TypeScript Conditional Types - Inferring

Recursive Types
Types that reference themselves.

Recursive Type Aliases
TypeScript

// JSON value type
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

const json: JSONValue = {
  name: "Alice",
  age: 30,
  hobbies: ["reading", "coding"],
  address: {
    city: "New York",
    coordinates: [40.7128, -74.006],
  },
  active: true,
  deletedAt: null,
};

// Tree structure
interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

const tree: TreeNode<string> = {
  value: "root",
  children: [
    {
      value: "child1",
      children: [
        { value: "grandchild1", children: [] },
        { value: "grandchild2", children: [] },
      ],
    },
    {
      value: "child2",
      children: [],
    },
  ],
};

// Linked List
interface LinkedList<T> {
  value: T;
  next: LinkedList<T> | null;
}

const list: LinkedList<number> = {
  value: 1,
  next: {
    value: 2,
    next: {
      value: 3,
      next: null,
    },
  },
};
Deep Partial
TypeScript

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  server: {
    host: string;
    port: number;
  };
}

// All nested properties are optional
const partialConfig: DeepPartial<Config> = {
  database: {
    credentials: {
      username: "admin",
    },
  },
};
Deep Readonly
TypeScript

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

const immutableConfig: DeepReadonly<Config> = {
  database: {
    host: "localhost",
    port: 5432,
    credentials: {
      username: "admin",
      password: "secret",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
};

// immutableConfig.database.host = "other"; // Error!
// immutableConfig.database.credentials.username = "root"; // Error!
Recursive Path Types
TypeScript

// Get all possible dot-notation paths of an object
type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never;
    }[keyof T]
  : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}.${P}`
    : `${K}`
  : never;

// Usage
interface Data {
  user: {
    name: string;
    address: {
      city: string;
      zip: string;
    };
  };
  posts: {
    title: string;
  }[];
}

type DataPaths = Paths<Data>;
// "user" | "user.name" | "user.address" | "user.address.city" | "user.address.zip" | "posts" | ...
Reference: TypeScript Recursive Types

Variance Annotations
TypeScript 4.7 introduced explicit variance annotations for type parameters.

TypeScript

// Covariant (out) — type parameter only in output positions
interface Producer<out T> {
  produce(): T;
}

// Contravariant (in) — type parameter only in input positions
interface Consumer<in T> {
  consume(value: T): void;
}

// Invariant (in out) — type parameter in both positions
interface Transformer<in out T> {
  transform(value: T): T;
}

// Example
class Animal {
  name: string = "";
}

class Dog extends Animal {
  breed: string = "";
}

// Covariant — Producer<Dog> is a subtype of Producer<Animal>
let dogProducer: Producer<Dog> = { produce: () => new Dog() };
let animalProducer: Producer<Animal> = dogProducer; // OK

// Contravariant — Consumer<Animal> is a subtype of Consumer<Dog>
let animalConsumer: Consumer<Animal> = { consume: (a) => console.log(a.name) };
let dogConsumer: Consumer<Dog> = animalConsumer; // OK
Reference: TypeScript 4.7 Variance Annotations

Satisfies Operator
Introduced in TypeScript 4.9, satisfies validates that an expression matches a type without changing the inferred type.

TypeScript

// Problem: type annotation loses specific information
type Color = "red" | "green" | "blue";
type ColorMap = Record<Color, string | [number, number, number]>;

// With type annotation — loses specificity
const colorsAnnotated: ColorMap = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};

// colorsAnnotated.red is string | [number, number, number]
// We can't call .map() on it without narrowing

// With satisfies — preserves the inferred type!
const colors = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies ColorMap;

// colors.red is [number, number, number] — specific!
colors.red.map((c) => c / 255); // OK!

// colors.green is string — specific!
colors.green.toUpperCase(); // OK!

// Still validates against ColorMap
const badColors = {
  red: [255, 0, 0],
  green: "#00ff00",
  // blue: 42, // Error! number is not string | [number, number, number]
  blue: [0, 0, 255],
} satisfies ColorMap;

// Practical example: route configuration
interface RouteConfig {
  path: string;
  component: string;
  exact?: boolean;
}

const routes = {
  home: { path: "/", component: "HomePage", exact: true },
  about: { path: "/about", component: "AboutPage" },
  users: { path: "/users", component: "UsersPage", exact: false },
} satisfies Record<string, RouteConfig>;

// routes.home.exact is boolean (true), not boolean | undefined
if (routes.home.exact) {
  console.log("Exact match");
}

// TypeScript knows the keys
type RouteNames = keyof typeof routes; // "home" | "about" | "users"
Reference: TypeScript 4.9 satisfies

Using Keyword (Disposable Resources)
TypeScript 5.2 introduced the using keyword for explicit resource management (TC39 proposal).

TypeScript

// Disposable interface
interface Disposable {
  [Symbol.dispose](): void;
}

interface AsyncDisposable {
  [Symbol.asyncDispose](): Promise<void>;
}

// File handle example
class FileHandle implements Disposable {
  private handle: number;

  constructor(public path: string) {
    console.log(`Opening file: ${path}`);
    this.handle = Math.random(); // Simulated handle
  }

  read(): string {
    return `Contents of ${this.path}`;
  }

  write(data: string): void {
    console.log(`Writing to ${this.path}: ${data}`);
  }

  [Symbol.dispose](): void {
    console.log(`Closing file: ${this.path}`);
    // Release file handle
  }
}

// Usage with 'using'
function processFile() {
  using file = new FileHandle("/tmp/data.txt");
  file.write("Hello, World!");
  const content = file.read();
  console.log(content);
  // file is automatically disposed when leaving scope
}

// Database connection example
class DatabaseConnection implements Disposable {
  constructor(private connectionString: string) {
    console.log(`Connecting to: ${connectionString}`);
  }

  query(sql: string): any[] {
    console.log(`Executing: ${sql}`);
    return [];
  }

  [Symbol.dispose](): void {
    console.log("Closing database connection");
  }
}

// Async disposable
class AsyncResource implements AsyncDisposable {
  async [Symbol.asyncDispose](): Promise<void> {
    console.log("Async cleanup");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function main() {
  await using resource = new AsyncResource();
  // Use resource...
  // Automatically disposed at end of scope
}
Reference: TypeScript 5.2 using Declarations, TC39 Explicit Resource Management

Performance Tips
Type-Level Performance
TypeScript

// 1. Prefer interfaces over type intersections for object types
// ✅ Good — interfaces are cached
interface User {
  name: string;
  age: number;
}

interface Admin extends User {
  role: string;
}

// ❌ Slower — intersection types are computed each time
type UserType = { name: string; age: number };
type AdminType = UserType & { role: string };

// 2. Use type annotations on exported functions
// ✅ Good — helps compiler skip inference
export function processData(data: string[]): Map<string, number> {
  const result = new Map<string, number>();
  data.forEach((item) => result.set(item, item.length));
  return result;
}

// 3. Avoid deeply nested conditional types
// ❌ Slow — deeply recursive
type DeepCheck<T> = T extends string
  ? T extends `${infer A}.${infer B}`
    ? DeepCheck<A> | DeepCheck<B>
    : T
  : never;

// 4. Use project references for large codebases
// tsconfig.json
// { "references": [{ "path": "./packages/core" }, { "path": "./packages/ui" }] }

// 5. Enable incremental compilation
// { "compilerOptions": { "incremental": true, "tsBuildInfoFile": ".tsbuildinfo" } }
Runtime Performance
TypeScript

// 1. const enums are inlined — zero runtime cost
const enum Direction {
  Up = "UP",
  Down = "DOWN",
}
// Compiles to: const dir = "UP" instead of Direction.Up

// 2. Use 'as const' for constant objects
const CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT: 5000,
} as const;
// Values are inlined by bundlers

// 3. Prefer unknown over any for type safety without performance cost
function parse(input: string): unknown {
  return JSON.parse(input);
}
References & Resources
Official Resources
Resource	URL
TypeScript Official Docs	typescriptlang.org/docs
TypeScript Handbook	typescriptlang.org/docs/handbook
TypeScript Playground	typescriptlang.org/play
TypeScript GitHub Repository	github.com/microsoft/TypeScript
TypeScript Release Notes	typescriptlang.org/docs/handbook/release-notes
TSConfig Reference	typescriptlang.org/tsconfig
DefinitelyTyped	github.com/DefinitelyTyped
Learning Resources
Resource	URL
TypeScript Deep Dive (Basarat)	basarat.gitbook.io/typescript
Type Challenges	github.com/type-challenges
Total TypeScript (Matt Pocock)	totaltypescript.com
TypeScript Error Translator	ts-error-translator.vercel.app
Execute Program	executeprogram.com/courses/typescript
TypeHero	typehero.dev
Community & Ecosystem
Resource	URL
TypeScript Reddit	reddit.com/r/typescript
TypeScript Discord	discord.gg/typescript
Stack Overflow TypeScript Tag	stackoverflow.com/questions/tagged/typescript
TypeScript Weekly Newsletter	typescript-weekly.com
Tools & Libraries
Tool	Description	URL
ts-node	Run TypeScript directly	github.com/TypeStrong/ts-node
tsx	Fast TypeScript executor	github.com/privatenumber/tsx
tsc-watch	Watch mode with restart	github.com/gilamran/tsc-watch
ts-prune	Find unused exports	github.com/nadeesha/ts-prune
typescript-eslint	ESLint plugin for TypeScript	typescript-eslint.io
zod	TypeScript-first schema validation	zod.dev
io-ts	Runtime type checking	github.com/gcanti/io-ts
ts-pattern	Pattern matching for TypeScript	github.com/gvergnaud/ts-pattern
Effect	TypeScript framework for effects	effect.website
Books
Book	Author
Programming TypeScript	Boris Cherny
Effective TypeScript: 62 Specific Ways to Improve Your TypeScript	Dan Vanderkam
Learning TypeScript	Josh Goldberg
TypeScript in 50 Lessons	Stefan Baumgartner
Type-Level TypeScript	Gabriel Vergnaud
