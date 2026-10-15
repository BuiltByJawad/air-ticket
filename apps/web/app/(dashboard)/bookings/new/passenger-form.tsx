'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passengerSchema } from '@/lib/validators/schemas';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Calendar, Phone, Mail, CreditCard, Globe, Trash2, Plus } from 'lucide-react';

const passengersArraySchema = z.object({
  passengers: z.array(passengerSchema).min(1, 'At least one passenger is required'),
});

type PassengersFormData = z.infer<typeof passengersArraySchema>;

interface PassengerFormProps {
  onSubmit: (data: PassengersFormData) => void;
  isLoading?: boolean;
  initialCount?: number;
}

export function PassengerForm({ onSubmit, isLoading, initialCount = 1 }: PassengerFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PassengersFormData>({
    resolver: zodResolver(passengersArraySchema),
    defaultValues: {
      passengers: Array.from({ length: initialCount }).map(() => ({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'M',
        passportNumber: '',
        passportExpiry: '',
        passportIssuingCountry: '',
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'passengers',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="sr-only focus-within:not-sr-only focus-within:p-4 focus-within:bg-accent focus-within:text-accent-foreground focus-within:rounded-md">
        <a href="#submit-booking-wizard">Skip to submission</a>
      </div>
      {fields.map((field, index) => (
        <Card key={field.id} className="relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              <span id={`passenger-title-${index}`}>Passenger {index + 1}</span>
            </CardTitle>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label={`Remove Passenger ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <fieldset aria-labelledby={`passenger-title-${index}`} className="grid gap-4 sm:grid-cols-2">
              <legend className="sr-only">Passenger Details</legend>
              <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.firstName`}>First Name</Label>
              <Input
                id={`passengers.${index}.firstName`}
                {...register(`passengers.${index}.firstName`)}
                placeholder="John"
                autoComplete="given-name"
                aria-invalid={!!errors.passengers?.[index]?.firstName}
                aria-describedby={errors.passengers?.[index]?.firstName ? `passengers.${index}.firstName-error` : undefined}
                className={errors.passengers?.[index]?.firstName ? 'border-destructive' : ''}
              />
              {errors.passengers?.[index]?.firstName && (
                <p id={`passengers.${index}.firstName-error`} className="text-xs text-destructive">{errors.passengers[index].firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.lastName`}>Last Name</Label>
              <Input
                id={`passengers.${index}.lastName`}
                {...register(`passengers.${index}.lastName`)}
                placeholder="Doe"
                autoComplete="family-name"
                aria-invalid={!!errors.passengers?.[index]?.lastName}
                aria-describedby={errors.passengers?.[index]?.lastName ? `passengers.${index}.lastName-error` : undefined}
                className={errors.passengers?.[index]?.lastName ? 'border-destructive' : ''}
              />
              {errors.passengers?.[index]?.lastName && (
                <p id={`passengers.${index}.lastName-error`} className="text-xs text-destructive">{errors.passengers[index].lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.email`}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id={`passengers.${index}.email`}
                  {...register(`passengers.${index}.email`)}
                  type="email"
                  placeholder="john.doe@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.passengers?.[index]?.email}
                  aria-describedby={errors.passengers?.[index]?.email ? `passengers.${index}.email-error` : undefined}
                  className={`pl-9 ${errors.passengers?.[index]?.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.passengers?.[index]?.email && (
                <p id={`passengers.${index}.email-error`} className="text-xs text-destructive">{errors.passengers[index].email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.phone`}>Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id={`passengers.${index}.phone`}
                  {...register(`passengers.${index}.phone`)}
                  placeholder="+1234567890"
                  autoComplete="tel"
                  aria-invalid={!!errors.passengers?.[index]?.phone}
                  aria-describedby={errors.passengers?.[index]?.phone ? `passengers.${index}.phone-error` : undefined}
                  className={`pl-9 ${errors.passengers?.[index]?.phone ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.passengers?.[index]?.phone && (
                <p id={`passengers.${index}.phone-error`} className="text-xs text-destructive">{errors.passengers[index].phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.dateOfBirth`}>Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id={`passengers.${index}.dateOfBirth`}
                  {...register(`passengers.${index}.dateOfBirth`)}
                  type="date"
                  autoComplete="bday"
                  aria-invalid={!!errors.passengers?.[index]?.dateOfBirth}
                  aria-describedby={errors.passengers?.[index]?.dateOfBirth ? `passengers.${index}.dateOfBirth-error` : undefined}
                  className={`pl-9 ${errors.passengers?.[index]?.dateOfBirth ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.passengers?.[index]?.dateOfBirth && (
                <p id={`passengers.${index}.dateOfBirth-error`} className="text-xs text-destructive">{errors.passengers[index].dateOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.gender`}>Gender</Label>
              <Select
                onValueChange={(val: 'M' | 'F' | 'O') => {
                  register(`passengers.${index}.gender`).onChange({ target: { value: val, name: `passengers.${index}.gender` } });
                }}
                defaultValue={field.gender}
              >
                <SelectTrigger id={`passengers.${index}.gender`} aria-invalid={!!errors.passengers?.[index]?.gender}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.passportNumber`}>Passport Number</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id={`passengers.${index}.passportNumber`}
                  {...register(`passengers.${index}.passportNumber`)}
                  placeholder="A1234567"
                  aria-invalid={!!errors.passengers?.[index]?.passportNumber}
                  aria-describedby={errors.passengers?.[index]?.passportNumber ? `passengers.${index}.passportNumber-error` : undefined}
                  className={`pl-9 ${errors.passengers?.[index]?.passportNumber ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.passengers?.[index]?.passportNumber && (
                <p id={`passengers.${index}.passportNumber-error`} className="text-xs text-destructive">{errors.passengers[index].passportNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.passportExpiry`}>Passport Expiry</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id={`passengers.${index}.passportExpiry`}
                  {...register(`passengers.${index}.passportExpiry`)}
                  type="date"
                  aria-invalid={!!errors.passengers?.[index]?.passportExpiry}
                  aria-describedby={errors.passengers?.[index]?.passportExpiry ? `passengers.${index}.passportExpiry-error` : undefined}
                  className={`pl-9 ${errors.passengers?.[index]?.passportExpiry ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.passengers?.[index]?.passportExpiry && (
                <p id={`passengers.${index}.passportExpiry-error`} className="text-xs text-destructive">{errors.passengers[index].passportExpiry.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`passengers.${index}.passportIssuingCountry`}>Issuing Country (ISO)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id={`passengers.${index}.passportIssuingCountry`}
                  {...register(`passengers.${index}.passportIssuingCountry`)}
                  placeholder="US"
                  maxLength={2}
                  className={`pl-9 uppercase ${errors.passengers?.[index]?.passportIssuingCountry ? 'border-destructive' : ''}`}
                  aria-invalid={!!errors.passengers?.[index]?.passportIssuingCountry}
                  aria-describedby={errors.passengers?.[index]?.passportIssuingCountry ? `passengers.${index}.passportIssuingCountry-error` : undefined}
                />
              </div>
              {errors.passengers?.[index]?.passportIssuingCountry && (
                <p id={`passengers.${index}.passportIssuingCountry-error`} className="text-xs text-destructive">{errors.passengers[index].passportIssuingCountry.message}</p>
              )}
              </div>
            </fieldset>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => append({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            gender: 'M',
            passportNumber: '',
            passportExpiry: '',
            passportIssuingCountry: '',
          })}
          aria-label="Add another passenger"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Passenger
        </Button>
        <Button id="submit-booking-wizard" type="submit" className="w-full sm:w-auto ml-auto" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> Processing...
            </>
          ) : (
            'Continue to Review'
          )}
        </Button>
      </div>
    </form>
  );
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
