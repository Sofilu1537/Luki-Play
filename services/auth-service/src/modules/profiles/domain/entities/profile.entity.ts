export class Profile {
  readonly id: string;
  readonly accountId: string;
  name: string;
  readonly isKids: boolean;
  pinHash: string | null;

  constructor(props: {
    id: string;
    accountId: string;
    name: string;
    isKids: boolean;
    pinHash: string | null;
  }) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.name = props.name;
    this.isKids = props.isKids;
    this.pinHash = props.pinHash;
  }
}
