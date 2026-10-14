package main

import "fmt"

func selectCohorts(groups [2]cohort, selected int) ([]cohort, error) {
	if selected < 0 || selected > len(groups) {
		return nil, fmt.Errorf("cohort must be 0 (both), 1 or 2, got %d", selected)
	}
	if selected == 0 {
		return groups[:], nil
	}
	return groups[selected-1 : selected], nil
}
