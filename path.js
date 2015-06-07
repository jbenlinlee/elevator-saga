{
	init: function(elevators, floors) {				
		function setupElevator(el) {
			el.on("stopped_at_floor", function(floorNum) {
				if (floorNum === (floors.length - 1)) {
					el.setGoingDn();
				} else if (floorNum === 0) {
					el.setGoingUp();
				}
				
				if (floorNum === el.path_end) {
					el.path_end = undefined;
				}
			});
			
			el.on("idle", function() {
			});
			
			el.path_end = undefined;
			
			el.setGoingUp = function() {
				el.goingUpIndicator(true);
				el.goingDownIndicator(false);
			}
			
			el.setGoingDn = function() {
				el.goingUpIndicator(false);
				el.goingDownIndicator(true);
			}
		}
		
		function setupFloor(fl) {
			fl.on("up_button_pressed", function() {
				fl.req_up = true;
			});
			
			fl.on("down_button_pressed", function() {
				fl.req_dn = true;
			});
		}
		
		for (var el = 0; el < elevators.length; ++el) {
			setupElevator(elevators[el]);
		}
	
		for (var fl = 0; fl < floors.length; ++fl) {
			setupFloor(floors[fl]);
			fl.req_up = false;
			fl.req_dn = false;
		}
	},
	
	update: function(dt, elevators, floors) {
		var floorsRequested = new Array(floors.length);
		for (var flNum = 0; flNum < floors.length; ++flNum) {
			floorsRequested[flNum] = {"up": floors[flNum].req_up, "dn": floors[flNum].req_dn};
		}
		
		for (var i = 0; i < elevators.length; ++i) {
			var el = elevators[i];
			
			if (el.destinationQueue.length == 0) {				
				var pressedFloors = el.getPressedFloors();
				var isPressedArr = new Array(floors.length);
				for (var fl = 0; fl < floors.length; ++fl) {
					isPressedArr[fl] = false;
				}
				for (var pf = 0; pf < pressedFloors.length; ++pf) {
					isPressedArr[pressedFloors[pf]] = true;
				}
				
				if (pressedFloors.length > 0) {
					console.debug("pressed: " + pressedFloors.join(","));
					
					if (el.path_end == undefined) {
						// Set path by selecting direction with most pressed floors
						// try in up dir
						var upFloors = 0;
						var maxUpFloor = el.currentFloor() + 1;
						if (el.currentFloor() < (floors.length - 1)) {
							for (var flnum = maxUpFloor; flnum < floors.length; ++flnum) {
								if (isPressedArr[flnum].up) {
									upFloors++;
									maxUpFloor = Math.max(maxUpFloor, flnum);
								}
							}
						}
						
						// try in down dir
						var dnFloors = 0;
						var minDnFloor = el.currentFloor() - 1;
						if (el.currentFloor() > 0) {
							for (var flnum = minDnFloor; flnum >= 0; ++flnum) {
								if (isPressedArr[flnum].dn) {
									dnFloors++;
									minDnFloor = Math.min(minDnFloor, flnum);
								}
							}
						}
						
						if (upFloors == 0 && dnFloors == 0) {
							el.path_end = undefined;
						} else if (upFloors > dnFloors) {
							console.debug("update path_end to " + maxUpFloor);
							el.path_end = maxUpFloor;
							el.setGoingUp();
						} else {
							console.debug("update path_end to " + minDnFloor);
							el.path_end = minDnFloor;
							el.setGoingDn();
						}
					}
					
					// Go to next pressed floor in direction of path end
					var dir = el.path_end > el.currentFloor() ? 1 : -1;
					for (var j = el.currentFloor() + dir; j >= 0 && j < floors.length; j += dir) {
						if (isPressedArr[j]) {
							if (dir == 1) {
								floors[j].req_up = false;
							} else {
								floors[j].req_dn = false;
							}
							
							el.goToFloor(j);
							break;
						}
					}
				} else {
					console.debug("No pressed floors, looking for closest requested floor");
					// Go to closest requested floor
					var closestFloor = el.currentFloor();
					var closestDistance = floors.length;
					for (var fl = 0; fl < floorsRequested.length; ++fl) {
						var floor = floors[fl];
						if (fl != el.currentFloor() && floorsRequested[fl].up === true || floorsRequested[fl].dn === true) {
							var dist = Math.abs(fl - el.currentFloor());
							if (dist < closestDistance) {
								closestDistance = dist;
								closestFloor = fl;
							}
						}
					}
					
					console.debug(floorsRequested);
					console.debug("on fl " + el.currentFloor() + " closest requested fl " + closestFloor + " at dist " + closestDistance);
					if (closestFloor == el.currentFloor()) {
						el.goingUpIndicator(true);
						el.goingDownIndicator(true);
					} else if (floorsRequested[closestFloor].up) {
						el.setGoingUp();
					} else {
						el.setGoingDn();
					}
					el.goToFloor(closestFloor);
					floors[closestFloor].req_up = false;
					floors[closestFloor].req_dn = false;
				}
			}
		}
	}
}