export class WeatherFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherFetchError";
  }
}

export class InvalidLocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLocationError";
  }
}
