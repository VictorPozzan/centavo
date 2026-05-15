import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency } from '../utils/format';

@Pipe({
  name: 'centavoCurrency',
  standalone: true,
})
export class CentavoCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '—';
    return formatCurrency(value);
  }
}