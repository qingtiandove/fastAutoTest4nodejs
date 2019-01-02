export class FastAutoTestError extends Error{
    constructor(err:Error|string){
        if(err instanceof Object){
            super((<Error>err).message);
            this.message=(<Error>err).message;
            this.stack=(<Error>err).stack;
        }else{
            super((<string>err));
            this.message=(<string>err);
        }
        this.name=this.constructor.name;
    }
}

export class ElementNotFoundError extends FastAutoTestError{

}
