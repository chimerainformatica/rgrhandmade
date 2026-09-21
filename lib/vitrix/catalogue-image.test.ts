import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOGUE_MIN_SOURCE_EDGE,
  getCollectionCardVariant,
  getCatalogueImagePresentation,
  getCatalogueImageQualityWarning,
} from "./catalogue-image";

test("the editorial cover uses the original source with a high-quality responsive profile", () => {
  const presentation = getCatalogueImagePresentation("editorial-cover");

  assert.equal(presentation.source, "original");
  assert.equal(presentation.fit, "cover");
  assert.equal(presentation.quality, 90);
  assert.match(presentation.sizes, /560px/);
});

test("an editorial cover without a gallery requests the full desktop container width", () => {
  const presentation = getCatalogueImagePresentation("editorial-cover-full");

  assert.equal(presentation.fit, "cover");
  assert.match(presentation.sizes, /1116px/);
});

test("compact collection cards fill their frame and use uppercase bold labels", () => {
  const presentation = getCatalogueImagePresentation("compact-card");

  assert.equal(presentation.source, "original");
  assert.equal(presentation.fit, "cover");
  assert.equal(presentation.quality, 90);
  assert.equal(presentation.uppercaseLabel, true);
  assert.match(presentation.sizes, /280px/);
});

test("wide collection cards preserve their contained image and typography", () => {
  const presentation = getCatalogueImagePresentation("wide-card");

  assert.equal(presentation.fit, "contain");
  assert.match(presentation.sizes, /560px/);
});

test("every collection product label uses uppercase Cormorant", () => {
  const compact = getCatalogueImagePresentation("compact-card");
  const wide = getCatalogueImagePresentation("wide-card");

  assert.equal(compact.uppercaseLabel, true);
  assert.equal(wide.uppercaseLabel, true);
  assert.match(compact.labelClassName, /font-serif/);
  assert.match(wide.labelClassName, /font-serif/);
});

test("single-item and spanning collection cards use the preserved wide presentation", () => {
  assert.equal(getCollectionCardVariant(1, 0), "wide-card");
  assert.equal(getCollectionCardVariant(3, 2), "wide-card");
  assert.equal(getCollectionCardVariant(2, 0), "compact-card");
  assert.equal(getCollectionCardVariant(4, 3), "compact-card");
});

test("modal thumbnails request only their rendered diameter", () => {
  const presentation = getCatalogueImagePresentation("modal-thumbnail");

  assert.equal(presentation.fit, "cover");
  assert.match(presentation.sizes, /82px/);
});

test("catalogue uploads warn when either source edge is below 2400 pixels", () => {
  assert.equal(CATALOGUE_MIN_SOURCE_EDGE, 2400);
  assert.match(getCatalogueImageQualityWarning(2399, 3200) ?? "", /2399.*3200/);
  assert.match(getCatalogueImageQualityWarning(3200, 2399) ?? "", /2400 px/);
});

test("catalogue uploads accept sources whose shortest edge is at least 2400 pixels", () => {
  assert.equal(getCatalogueImageQualityWarning(2400, 3200), null);
  assert.equal(getCatalogueImageQualityWarning(4096, 4096), null);
});
