import { User as UserType } from "../types";

export class User {
  private readonly _id: string;
  private readonly _name: string;
  private _avatar?: string;

  constructor(data: UserType) {
    this._id = data.id;
    this._name = data.name;
    this._avatar = data.avatar;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  set avatar(newAvatar: string | undefined) {
    this._avatar = newAvatar;
  }
}
