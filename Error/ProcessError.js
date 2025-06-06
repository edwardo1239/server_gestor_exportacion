class ProcessError extends Error {
    constructor(code, message) {
        super();
        this.name = "ProcessError"
        this.status = code
        this.message = message
    }
}

class ItemBussyError extends Error {
    constructor(code, message) {
        super();
        this.name = "Bussy item error"
        this.status = code
        this.message = message
    }
}

class UtilError extends Error {
    constructor(code, message) {
        super();
        this.name = "Error de utilidad"
        this.status = code
        this.message = message
    }
}


export {
    ProcessError,
    ItemBussyError,
    UtilError
}
