import { FileNodeRule } from "..";

export class State {
  data: { [key in string]: any } = {};
  datumUser: { [key in string]: FileNodeRule } = {};
}
