declare module "@jscad/stl-serializer" {
  type Serializer = {
    serialize(
    options: { binary?: boolean },
    ...objects: unknown[]
    ): Array<ArrayBuffer | string>;
  };
  const serializer: Serializer;
  export default serializer;
}
