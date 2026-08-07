import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'thaiDate',
  standalone: true
})
export class ThaiDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: string = 'd MMMM yyyy'): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const thaiYear = year + 543;

    const datePipe = new DatePipe('th-TH');
    
    // Replace year tokens with a placeholder
    let safeFormat = format.replace(/yyyy/g, "'[YYYY]'").replace(/yy/g, "'[YY]'");
    let formatted = datePipe.transform(date, safeFormat);
    
    if (formatted) {
        formatted = formatted.replace('[YYYY]', thaiYear.toString());
        formatted = formatted.replace('[YY]', thaiYear.toString().slice(-2));
    }
    
    return formatted || '';
  }
}
