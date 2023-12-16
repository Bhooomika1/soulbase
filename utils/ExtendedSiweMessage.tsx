import { SiweMessage } from 'siwe';

export class ExtendedSiweMessage extends SiweMessage {
  username?: string;
  name?: string;
  pfp?: string;
  isVerified?: boolean;

  constructor(param: any) {
    super(param);
    this.username = param.username;
    this.name = param.name;
    this.pfp = param.pfp;
    this.isVerified = param.isVerified;
  }
}
