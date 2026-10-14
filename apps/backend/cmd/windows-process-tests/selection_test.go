package main

import (
	"reflect"
	"testing"
)

func TestSelectedCohortRetainsNativePartitionAndRejectsInvalidSelection(t *testing.T) {
	groups, err := partition(sampleInventory())
	if err != nil {
		t.Fatal(err)
	}
	both, err := selectCohorts(groups, 0)
	if err != nil || !reflect.DeepEqual(both, groups[:]) {
		t.Fatalf("local mode lost a cohort: %v, %v", both, err)
	}
	for index := 1; index <= 2; index++ {
		selected, err := selectCohorts(groups, index)
		if err != nil || !reflect.DeepEqual(selected, groups[index-1:index]) {
			t.Fatalf("hosted cohort %d changed selection: %v, %v", index, selected, err)
		}
	}
	for _, index := range []int{-1, 3} {
		if _, err := selectCohorts(groups, index); err == nil {
			t.Fatalf("invalid cohort %d accepted", index)
		}
	}
}
