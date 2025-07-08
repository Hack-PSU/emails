/* eslint-disable @typescript-eslint/no-empty-object-type */

import React from "react";

export type WithChildren<T = {}> = T & {
  children?: React.ReactNode;
};
