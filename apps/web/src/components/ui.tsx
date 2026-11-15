import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {X} from 'lucide-react';
import {clsx,type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
import {cva,type VariantProps} from 'class-variance-authority';
import type {ButtonHTMLAttributes,ReactNode} from 'react';
export const cn=(...inputs:ClassValue[])=>twMerge(clsx(inputs));
const buttonVariants=cva('button',{variants:{variant:{default:'button-primary',secondary:'button-secondary',ghost:'button-ghost',danger:'button-danger'}},defaultVariants:{variant:'default'}});
export function Button({className,variant,...props}:ButtonHTMLAttributes<HTMLButtonElement>&VariantProps<typeof buttonVariants>){return <button className={cn(buttonVariants({variant}),className)} {...props}/>;}
export function Dialog({open,onOpenChange,title,description,children}:{open:boolean;onOpenChange:(value:boolean)=>void;title:string;description?:string;children:ReactNode}){return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay"/><DialogPrimitive.Content className="dialog-content"><DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title><DialogPrimitive.Description className={description?'muted':'sr-only'}>{description??title}</DialogPrimitive.Description><DialogPrimitive.Close className="icon-button dialog-close" aria-label="Close dialog"><X size={20}/></DialogPrimitive.Close>{children}</DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>;}
export function Tooltip({text,children}:{text:string;children:ReactNode}){return <TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content className="tooltip" sideOffset={8}>{text}<TooltipPrimitive.Arrow/></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root>;}
