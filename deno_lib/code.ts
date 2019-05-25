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

  /** Creates a code instance from its extended JSON representation. */
  static fromExtendedJSON(doc: {
    $code: Function | string;
    $scope?: { [key: string]: any };
  }): Code {
    return new Code(doc.$code, doc.$scope!);
  }

  /** JSON fragment representation of a code instance. */
  toJSON(): { code: Function | string; scope: { [key: string]: any } } {
    return { scope: this.scope, code: this.code };
  }

  /** Extended JSON representation of a code instance. */
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
