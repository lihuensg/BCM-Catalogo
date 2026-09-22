import { useId, Children, isValidElement, cloneElement } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode, ReactElement } from 'react';
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={'input ' + (props.className ?? '')}/>; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className="input textarea"/>; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className="input"/>; }
export function FormField({ label, children, helper, error, required }: {
    label: string;
    children: ReactNode;
    helper?: string | undefined;
    error?: string | undefined;
    required?: boolean | undefined;
}) { const id=useId(); const description=[helper?id+'-help':'',error?id+'-error':''].filter(Boolean).join(' '); return <div className="form-field"><div className="field-label"><label htmlFor={id}>{label}</label>{required&&<span aria-hidden="true"> *</span>}</div>{Children.map(children,(child,index)=>index===0&&isValidElement(child)?cloneElement(child as ReactElement<{id:string;'aria-describedby':string;'aria-invalid':boolean}>,{id,'aria-describedby':description,'aria-invalid':!!error}):child)}{helper&&<small id={id+'-help'}>{helper}</small>}{error&&<small id={id+'-error'} className="field-error" role="alert">{error}</small>}</div>; }

export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & {
    label: string;
}) { return <label className="check-label"><input {...props} type="checkbox"/>{label}</label>; }
export function Switch({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & {
    label: string;
}) { return <label className="switch-label"><input {...props} type="checkbox" role="switch"/><span className="switch-track" aria-hidden="true"/>{label}</label>; }
export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) { return <Input {...props} type="search" aria-label={props['aria-label'] ?? 'Buscar'} placeholder={props.placeholder ?? 'Buscar…'}/>; }
