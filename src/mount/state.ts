export type State<Options = {}, Parent extends State<{}, any> | null = null> = {
  parent?: Parent;
} & Options;
