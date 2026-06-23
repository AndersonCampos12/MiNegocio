import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tienda } from './tienda';

describe('Tienda', () => {
  let component: Tienda;
  let fixture: ComponentFixture<Tienda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tienda],
    }).compileComponents();

    fixture = TestBed.createComponent(Tienda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
