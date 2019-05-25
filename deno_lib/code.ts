/** A class representation of the BSON Code type. */
export class Code {
  readonly _bsontype: string = "Code";
  readonly code: Function | string;
  readonly scope: { [key: string]: any };

  /** Creates a Code type. */
  constructor(code: Function | string, scope?: { [key: string]: any }) {
    this.code = code;
    this.scope = scope;
  }

  static fromExtendedJSON(doc: {
    $code: Function | string;
    $scope?: { [key: string]: any };
  }): Code {
    return new Code(doc.$code, doc.$scope!);
  }

  toJSON(): { code: Function | string; scope: { [key: string]: any } } {
    return { scope: this.scope, code: this.code };
  }

  toExtendedJSON(): {
    $code: Function | string;
    $scope?: { [key: string]: any };
  } {
    if (this.scope) {
      return { $code: this.code, $scope: this.scope };
    }
    return { $code: this.code };
  }
}
