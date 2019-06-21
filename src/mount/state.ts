export type State<
  Options = {},
  Parent extends State<{}, State> | null = null
> = {
  parent?: Parent;
} & Options;
