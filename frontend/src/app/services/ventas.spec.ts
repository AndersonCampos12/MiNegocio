import { TestBed } from '@angular/core/testing';

import { Ventas } from './ventas';

describe('Ventas', () => {
  let service: Ventas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ventas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
