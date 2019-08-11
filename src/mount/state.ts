import { FileNodeRule } from "..";

export class State {
  data: { [key in string]: any } = {};
  dataUsing: { [key in string]: FileNodeRule } = {};
}
