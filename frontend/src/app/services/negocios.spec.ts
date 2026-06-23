import { TestBed } from '@angular/core/testing';

import { Negocios } from './negocios';

describe('Negocios', () => {
  let service: Negocios;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Negocios);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
