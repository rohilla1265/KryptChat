import validator from "validator";
export default function validate(data){
    const mandatoryField = ['firstname','email','password'];
    const isAllowed = mandatoryField.every((k)=>Object.keys(data).includes(k));
    if(!isAllowed){
        throw new Error("some fields missing");
    }
    if(!validator.isEmail(data.email)){
        throw new Error("Invalid email");
    }
    if(!validator.isStrongPassword(data.password)){
        throw new Error("week password");
    }
}