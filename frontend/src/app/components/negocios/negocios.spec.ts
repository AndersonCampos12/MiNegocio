import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Negocios } from './negocios';

describe('Negocios', () => {
  let component: Negocios;
  let fixture: ComponentFixture<Negocios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Negocios],
    }).compileComponents();

    fixture = TestBed.createComponent(Negocios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
