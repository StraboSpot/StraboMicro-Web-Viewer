var mainImageHeight = 0;
var conversionRatio = 0;
var projectId = null;
var canvas = null;
var micrographs = [];
var projectData = null;
if(smzFilesLocation == null){
	const smzFilesLocation = "notset";
}

function isJSON(str) {
    if (typeof str !== 'string') return false;
    try {
        const result = JSON.parse(str);
        const type = Object.prototype.toString.call(result);
        return type === '[object Object]' 
            || type === '[object Array]';
    } catch (err) {
        return false;
    }
}

function loadProject(){
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	projectId = urlParams.get('p')
	if(projectId != null){

	$.ajax({
		url : smzFilesLocation + projectId + "/project.json",
		type: "GET",
		processData: false,
		contentType: false,
		success:function(data){
			projectData = data;
			canvas = new fabric.Canvas('coveringCanvas');
			canvas.setWidth(750);
			
			jQuery( function() {
				jQuery( "#accordion" ).accordion({
					active: false,
					collapsible: true,
					heightStye: "fill"
				});
			} );
			
			if(showHeader) unHideHeader();
			if(showFooter) unHideFooter();
			gatherAllMicrographs(data);
			loadSideBar(data);
			switchToMicrograph(micrographs[0].id);
		},
		error: function(){
			document.getElementById("whole-doc").innerHTML = "Unable to load project " + projectId + ".";   
		}
	});

	}else{
		document.getElementById("whole-doc").innerHTML = "Project ID not provided.";
	}
}

function unHideHeader(){
	document.getElementById("topBar").style.display="block";
	document.getElementById("topHRDiv").style.display="block";
}

function unHideFooter(){
	document.getElementById("footer").style.display="block";
}

function gatherAllMicrographs(data){
	micrographs = [];
	if(data.datasets != null){
		data.datasets.forEach((ds) => {
			if(ds.samples != null){
				ds.samples.forEach((sample) => {
					if(sample.micrographs != null){
						sample.micrographs.forEach((micrograph) => {
							micrographs.push(micrograph);
						});
					}
				});
			}
		});
	}
}

function loadSideBar(data){
	let sideBar = document.getElementById("leftColumn");
	sideBar.innerHTML = "";
	if(data.datasets != null){
		data.datasets.forEach((ds) => {
			if(ds.samples != null){
				ds.samples.forEach((sample) => {
					sideBar.innerHTML += '<div class="sampleLabel">Sample: '+sample.label+'</div>';
					if(sample.micrographs != null){
						sample.micrographs.forEach((micrograph) => {
							if(micrograph.parentID == null){
								recursiveShowSideMicrograph(micrograph);
							}
						});
					}
				});
			}
		});
	}
}

function showSpotDetails(inSpotId){
	let outData = null;
	let sampleData = null;
	
	if(projectData.datasets != null){
		projectData.datasets.forEach((dataset) => {
			if(dataset.samples != null){
				dataset.samples.forEach((sample) => {
					if(sample.micrographs != null){
						sample.micrographs.forEach((micrograph) => {
							if(micrograph.spots != null){
								micrograph.spots.forEach((spot) => {
									if(spot.id == inSpotId){
										outData = spot;
										sampleData = sample;
									}
								});
							}
						});
					}
				});
			}
		});
	}

	let accordionString = showSideDetails("spot", outData, sampleData);
	document.getElementById("accordion").innerHTML = accordionString;
	
	$("#accordion").accordion("destroy");
	$( "#accordion" ).accordion({active: false, collapsible: true, heightStyle: "fill" });	
}

function showMicrographDetails(inMicrographId){
	let outData = null;
	let sampleData = null;
	
	if(projectData.datasets != null){
		projectData.datasets.forEach((dataset) => {
			if(dataset.samples != null){
				dataset.samples.forEach((sample) => {
					if(sample.micrographs != null){
						sample.micrographs.forEach((micrograph) => {
							if(micrograph.id == inMicrographId){
								outData = micrograph;
								sampleData = sample;
							}
						});
					}
				});
			}
		});
	}

	let accordionString = showSideDetails("micrograph", outData, sampleData);
	document.getElementById("accordion").innerHTML = accordionString;
	
if($("#accordion").hasClass("ui-accordion")){
   $("#accordion").accordion("destroy");
}
	
	$( "#accordion" ).accordion({active: false, collapsible: true, heightStyle: "fill" }); //content
}

function fixOperator(op){
	let outOp = " ";
	if(op == "eq") outOp = "=";
	if(op == "lt") outOp = "<";
	if(op == "gt") outOp = ">";
	return outOp;
}

function showSideDetails(type, outData, sampleData, excludes=[]){
	
	let sideName = "";
	if(type == "micrograph"){
		sideName = "Micrograph: " + outData.name;
	}else{
		sideName = "Spot: " + outData.name;
	}

	document.getElementById("rightHeader").innerHTML = sideName;
	
	side = "";
	side += "<h3>Sample Details:</h3>";
	side += "<div>";
	side += addBasicHeaders(sampleData, excludes);
	side += "</div>";
	
	let header = "";
	if(type == "micrograph"){
		header = "Micrograph Details:";
	}else{
		header = "Spot Details";
	}
	
	side += "<h3>" + header + "</h3>";
	side += "<div>";
	side += addBasicHeaders(outData, ['color','showLabel','date','time','modifiedTimestamp','geometryType']);
	side += "</div>";
	
	//Orientation
	if(outData.orientationInfo != null){
		side += "<h3>Orientation Info:</h3>";
		side += "<div>";
		side += addBasicHeaders(outData.orientationInfo, excludes);
		side += "</div>";	
	}
	
	//Instrument
	if(outData.instrument != null){
		side += "<h3>Instrument:</h3>";
		side += "<div>";
		side += addBasicHeaders(outData.instrument, excludes);
		
		if(outData.instrument.instrumentDetectors != null){
			side += '<strong>Detectors:</strong>';
			side += '<div style="padding-left:35px;">';
			side += '<ol>';

			outData.instrument.instrumentDetectors.forEach((detector) => {
				side += '<li>';
				side += detector.detectorType;
				if(detector.detectorMake != null && detector.detectorMake != "") side += ", " + detector.detectorMake;
				if(detector.detectorModel != null && detector.detectorModel != "") side += ", " + detector.detectorModel;
				side += '</li>';
			});

			side += '</ol>';
			side += '</div>';

		}
		
		side += "</div>";	
	}
	
	//Mineralogy/Lithology
	if((outData.mineralogy != null && outData.mineralogy != "") || (outData.lithologyInfo != null && outData.lithologyInfo != "")){
		side += "<h3>Mineralogy/Lithology Info:</h3>";
		side += "<div>";
		
		if(outData.mineralogy != null && outData.mineralogy != ""){
			side += '<strong>Mineralogy:</strong>';
			side += '<div style="padding-left:5px;">';
			side += addBasicHeaders(outData.mineralogy);
			
			if(outData.mineralogy.minerals != null && outData.mineralogy.minerals != ""){
				side += '<strong>Minerals:</strong>';
				side += '<div style="padding-left:35px;">';
				side += '<ol>';
				outData.mineralogy.minerals.forEach((mineral) => {
					side += '<li>';
					side += mineral.name;
					if(mineral.operator != null && mineral.operator != "") side += " " + fixOperator(mineral.operator);
					if(mineral.percentage != null && mineral.percentage != "") side += " " + mineral.percentage + "%";
					side += '</li>';
				});
				side += '</ol>';
				side += '</div>';

			}

			side += '</div>';
		}
		
		if(outData.lithologyInfo != null && outData.lithologyInfo != ""){
			side += '<strong>Lithology:</strong>';
			side += '<div style="padding-left:5px;">';
			
			if(outData.lithologyInfo.lithologies != null && outData.lithologyInfo.lithologies.length > 0){
			
				side += '<div style="padding-left:35px;">';
				side += '<ol>';
				
				outData.lithologyInfo.lithologies.forEach((lith) => {
				
					side += '<li>';
					
					let level1 = "";
					let level2 = "";
					let level3 = "";
					let maxLevel = "";
					let showString = "";
					let outString = "";
					
					if(lith.level1 != null && lith.level1 != ""){
						if(lith.level1 == "Other"){
							if(lith.level1Other != null && lith.level1Other != ""){
								level1 = "Other: " + lith.level1Other;
							}else{
								level1 = "Other";
							}
						}else{
							level1 = lith.level1;
						}
						maxLevel = "level1";
					}
					
					if(lith.level2 != null && lith.level2 != ""){
						if(lith.level2 == "Other"){
							if(lith.level2Other != null && lith.level2Other != ""){
								level2 = "Other: " + lith.level2Other;
							}else{
								level2 = "Other";
							}
						}else{
							level2 = lith.level2;
						}
						maxLevel = "level2";
					}
					
					if(lith.level3 != null && lith.level3 != ""){
						if(lith.level3 == "Other"){
							if(lith.level3Other != null && lith.level3Other != ""){
								level3 = "Other: " + lith.level3Other;
							}else{
								level3 = "Other";
							}
						}else{
							level3 = lith.level3;
						}
						maxLevel = "level3";
					}
					
					if(maxLevel == "level3"){
						showString = level3 + " (" + level1 + ", " + level2 + ")";
					}else if(maxLevel == "level2"){
						showString = level2 + " (" + level1 + ")";
					}else{
						showString = level1;
					}
					
					side += showString;

					side += '</li>';
				
				});
				
				side += '</ol>';
				side += '</div>';

			
			}
			
			side += addBasicHeaders(outData.lithologyInfo);
			side += '</div>';
		}
		
		side += "</div>";	
	}

	//Grain Info
	if(outData.grainInfo != null && outData.grainInfo != ""){
	
		side += '<h3>Grain Info:</h3>';
		side += '<div>';
		
		if(outData.grainInfo.grainSizeInfo != null && outData.grainInfo.grainSizeInfo.length > 0){
			side += '<strong>Grain Size Info:</strong>';
			side += '<div style="padding-left:25px;">';
			
			outData.grainInfo.grainSizeInfo.forEach((g) => {
				side += addBasicHeaders(g);
				if(g.phases != null && g.phases.length > 0){
					side += '<div><strong>Phases:</strong>' + g.phases.join(", ") + '</div>';
				}
			});
			
			side += '</div>';
		}
		
		if(outData.grainInfo.grainShapeInfo != null && outData.grainInfo.grainShapeInfo.length > 0){
			side += '<strong>Grain Shape Info:</strong>';
			side += '<div style="padding-left:25px;">';
			
			outData.grainInfo.grainShapeInfo.forEach((g) => {
				side += addBasicHeaders(g);
				if(g.phases != null && g.phases.length > 0){
					side += '<div><strong>Phases:</strong>' + g.phases.join(", ") + '</div>';
				}
			});
			
			side += '</div>';
		}
		
		if(outData.grainInfo.grainOrientationInfo != null && outData.grainInfo.grainOrientationInfo.length > 0){
			side += '<strong>Grain Orientation Info:</strong>';
			side += '<div style="padding-left:25px;">';
			
			outData.grainInfo.grainOrientationInfo.forEach((g) => {
				side += addBasicHeaders(g);
				if(g.phases != null && g.phases.length > 0){
					side += '<div><strong>Phases:</strong>' + g.phases.join(", ") + '</div>';
				}
			});
			
			side += '</div>';
		}
		
		side += addBasicHeaders(outData.grainInfo);
		
		side += '</div>';
	}


	//Fabric Info
	if(outData.fabricInfo != null && outData.fabricInfo != ""){
	
		side += '<h3>Fabric Info:</h3>';
		side += '<div>';
		
		if(outData.fabricInfo.fabrics != null && outData.fabricInfo.fabrics.length > 0){
			outData.fabricInfo.fabrics.forEach((f) => {
				side += '<strong>Fabric:</strong>';
				side += '<div style="padding-left:25px;">';
				side += addBasicHeaders(f);
				
				if(f.fabricDefinedBy != null && f.fabricDefinedBy != ""){
					side += '<div><strong>Defined By:</strong>' + f.fabricDefinedBy.join(", ") + '</div>';
				}

				if(f.fabricGrainSizeInfo != null && f.fabricGrainSizeInfo != ""){
					side += '<strong>Fabric Grain Size Info:</strong>';
					side += '<div style="padding-left:25px;">';
					
					if(f.fabricGrainSizeInfo.layers != null && f.fabricGrainSizeInfo.layers.length > 0){
					
						side += '<strong>Layers:</strong>';
						side += '<ol>';
						
						f.fabricGrainSizeInfo.layers.forEach((l) => {
							side += '<li style="margin-left:25px;">Grain Size: ' + l.grainSize + ', Thickness: ' + l.thickness + ' ' + l.thicknessUnits + '</li>';
						});
						
						side += '</ol>';
					
					}
					
					side += addBasicHeaders(f.fabricGrainSizeInfo);
					
					side += '</div>';
				}

				if(f.fabricCompositionInfo != null && f.fabricCompositionInfo != ""){
					side += '<strong>Fabric Composition Info:</strong>';
					side += '<div style="padding-left:25px;">';
					
					if(f.fabricCompositionInfo.layers != null && f.fabricCompositionInfo.layers.length > 0){
					
						side += '<strong>Layers:</strong>';
						side += '<ol>';
						
						f.fabricCompositionInfo.layers.forEach((l) => {
							side += '<li style="margin-left:25px;">Grain Size: ' + l.grainSize + ', Thickness: ' + l.thickness + ' ' + l.thicknessUnits + '</li>';
						});
						
						side += '</ol>';
					
					}
					
					side += addBasicHeaders(f.fabricCompositionInfo);
					
					side += '</div>';
				}

				if(f.fabricGrainShapeInfo != null && f.fabricGrainShapeInfo != ""){
					side += '<strong>Fabric Grain Shape Info:</strong>';
					side += '<div style="padding-left:25px;">';
					side += addBasicHeaders(f.fabricGrainShapeInfo);
					
					if(f.fabricGrainShapeInfo.phases != null && f.fabricGrainShapeInfo.phases.length > 0){
						side += '<div><strong>Phases:</strong> ' + f.fabricGrainShapeInfo.phases.join(", ") + '</div>';
					}
					
					side += '</div>';
				}

				if(f.fabricCleavageInfo != null && f.fabricCleavageInfo != ""){
					side += '<strong>Fabric Cleavage Info:</strong>';
					side += '<div style="padding-left:25px;">';
					side += addBasicHeaders(f.fabricCleavageInfo);
					
					if(f.fabricCleavageInfo.phases != null && f.fabricCleavageInfo.phases.length > 0){
						side += '<div><strong>Phases:</strong> ' + f.fabricCleavageInfo.phases.join(", ") + '</div>';
					}
					
					side += '</div>';
				}

				side += '</div>';
			});
		}
		
		side += addBasicHeaders(outData.fabricInfo);

		side += '</div>';
	}

	//Extinction Microstructure Info
	if(outData.extinctionMicrostructureInfo != null && outData.extinctionMicrostructureInfo != ""){
	
		side += '<h3>Extinction Microstructure Info:</h3>';
		side += '<div>';

		if(outData.extinctionMicrostructureInfo.extinctionMicrostructures != null && outData.extinctionMicrostructureInfo.extinctionMicrostructures.length > 0){
			outData.extinctionMicrostructureInfo.extinctionMicrostructures.forEach((v) => {
				side += '<strong>Extinction Microstructure:</strong>';
				side += '<div style="padding-left:25px;">';
				
				if(v.phase != null && v.phase != ""){
					side += '<div><strong>Phase:</strong>' + v.phase + '</div>';
				}
				
				side += showArray(v.dislocations, 'Dislocations');
				side += showArray(v.subDislocations, 'Dislocation Types');
				side += showArray(v.heterogeneousExtinctions, 'Heterogeneous Extinctions');
				side += showArray(v.subGrainStructures, 'SubGrain Structures');
				side += showArray(v.extinctionBands, 'Extinction Bands');
				side += showArray(v.subWideExtinctionBands, 'Wide Extinction Bands');
				side += showArray(v.subFineExtinctionBands, 'Fine Extinction Bands');
				
				side += '</div>';
			});
		}

		side += addBasicHeaders(outData.extinctionMicrostructureInfo);
		side += '</div>';
	}

	//Clastic Deformation Band Info
	if(outData.clasticDeformationBandInfo != null && outData.clasticDeformationBandInfo != ""){
	
		side += '<h3>Clastic Deformation Band Info:</h3>';
		side += '<div>';
		
		if(outData.clasticDeformationBandInfo.bands != null && outData.clasticDeformationBandInfo.bands.length > 0){
			outData.clasticDeformationBandInfo.bands.forEach((b) => {
				side += '<strong>Band:</strong>';
				side += '<div style="padding-left:25px;">';
				side += showArray(b.types, 'Types');
				side += addBasicHeaders(b);
				side += '</div>';
			});
		}

		side += addBasicHeaders(outData.clasticDeformationBandInfo);
		side += '</div>';
	}

	//Grain Boundary Info
	if(outData.grainBoundaryInfo != null && outData.grainBoundaryInfo != ""){
	
		side += '<h3>Grain Boundary Info:</h3>';
		side += '<div>';
		
		if(outData.grainBoundaryInfo.boundaries != null && outData.grainBoundaryInfo.boundaries.length > 0){
			outData.grainBoundaryInfo.boundaries.forEach((b) => {
				side += '<strong>Boundary:</strong>';
				side += '<div style="padding-left:25px;">';
				
				side += showArray(b.morphologies, 'Morphologies');
				
				if(b.descriptors != null && b.descriptors.length > 0){

					side += '<div>';
					side += '<strong>Descriptors:</strong><br>';
					side += '<ol style="padding-left:25px;">';

					b.descriptors.forEach((d) => {
						let thisD = 'Type: ' + d.type;
						let types = [];
						if(d.subTypes != null && d.subTypes.length > 0){
							d.subTypes.forEach((t) => {
								types.push(t.type);
							});
							thisD += ' Subtypes: ' + types.join(", ");
						}
						side += '<li>' + thisD + '</li>';
					});
					
					side += '</ol>';
					side += '</div>';

				}
				
				side += '</div>';
			});
		}

		side += addBasicHeaders(outData.grainBoundaryInfo);
		side += '</div>';
	}

	//IntraGrain Info
	if(outData.intraGrainInfo != null && outData.intraGrainInfo != ""){
	
		side += '<h3>IntraGrain Info:</h3>';
		side += '<div>';
		
		if(outData.intraGrainInfo.grains != null && outData.intraGrainInfo.grains.length > 0){
			outData.intraGrainInfo.grains.forEach((g) => {
				side += '<strong>Grain:</strong>';
				side += '<div style="padding-left:25px;">';
				side += '<div><strong>Mineral: ' + g.mineral + '</strong></div>';
				side += showArray(g.grainTextures, 'Textures');
				side += '</div>';
			});
		}

		side += addBasicHeaders(outData.intraGrainInfo);
		side += '</div>';
	}

	//Vein Info
	if(outData.veinInfo != null && outData.veinInfo != ""){
	
		side += '<h3>Vein Info:</h3>';
		side += '<div>';
		
		
		if(outData.veinInfo.veins != null && outData.veinInfo.veins.length > 0){
			outData.veinInfo.veins.forEach((v) => {
				side += '<strong>Vein:</strong>';
				side += '<div style="padding-left:25px;">';
				side += '<div><strong>Mineralogy: ' + v.mineralogy + '</strong></div>';
				
				side += showArray(v.crystalShapes, 'Crystal Shapes');
				side += showArray(v.growthMorphologies, 'Growth Morphologies');
				
				if(v.inclusionTrails != null && v.inclusionTrails.length > 0){
					let showString = "";
					v.inclusionTrails.forEach((bb) => {
						let parts = [];
						if(bb.type != null && bb.type != "") parts.push(bb.type);
						if(bb.subType != null && bb.subType != "") parts.push(bb.subType);
						if(bb.numericValue != null && bb.numericValue != "") parts.push(bb.numericValue);
						if(bb.unit != null && bb.unit != "") parts.push(bb.unit);
						showString += parts.join(", ");
					});
					side += '<div><strong>Inclusion Trails:</strong> ' + showString + '</div>';
				}
				
				side += showArray(v.kinematics, 'Kinematics');

				side += '</div>';
			});
		}

		side += addBasicHeaders(outData.veinInfo);
		side += '</div>';
	}
	
	//Pseudotachylyte Info
	if(outData.pseudotachylyteInfo != null && outData.pseudotachylyteInfo != ""){
	
		side += '<h3>Pseudotachylyte Info:</h3>';
		side += '<div>';
		
		if(outData.pseudotachylyteInfo.pseudotachylytes != null && outData.pseudotachylyteInfo.pseudotachylytes.length > 0){
			outData.pseudotachylyteInfo.pseudotachylytes.forEach((v) => {
				side += '<strong>Psudotachylyte:</strong>';
				side += '<div style="padding-left:25px;">';
				side += addBasicHeaders(v);
				side += '</div>';

			});
		}
		
		side += addBasicHeaders(outData.pseudotachylyteInfo);
		side += '</div>';
	}

	//Fold Info
	if(outData.foldInfo != null && outData.foldInfo != ""){
	
		side += '<h3>Fold Info:</h3>';
		side += '<div>';

		if(outData.foldInfo.folds != null && outData.foldInfo.folds.length > 0){
			outData.foldInfo.folds.forEach((f) => {
				side += '<strong>Fold:</strong>';
				side += '<div style="padding-left:25px;">';
				side += addBasicHeaders(f);
				
				if(f.interLimbAngle != null && f.interLimbAngle.length > 0){
					side += '<div><strong>Inter-Limb Angle:</strong> ' + f.interLimbAngle.join(", ") + '</div>';
				}
				
				side += '</div>';

			});
		}

		side += addBasicHeaders(outData.foldInfo);
		side += '</div>';
	}

	//Fracture Info
	if(outData.fractureInfo != null && outData.fractureInfo != ""){
	
		side += '<h3>Fracture Info:</h3>';
		side += '<div>';

		if(outData.fractureInfo.fractures != null && outData.fractureInfo.fractures.length > 0){
			outData.fractureInfo.fractures.forEach((f) => {
				side += '<strong>Fracture:</strong>';
				side += '<div style="padding-left:25px;">';
				
				let show = "";
				if(f.granularity != null && f.granularity != "") show += f.granularity + " ";
				if(f.mineralogy != null && f.mineralogy != "") show += f.mineralogy + " ";
				if(f.kinematicType != null && f.kinematicType != "") show += f.kinematicType + " ";
			
				if(f.openingAperture != null && f.openingAperture != "") show += 'Aperture: ' + f.openingAperture + " " + f.openingApertureUnit + " ";
				if(f.shearOffset != null && f.shearOffset != "") show += 'Offset: ' + f.shearOffset + " " + f.shearOffsetUnit + " ";
				if(f.hybridAperture != null && f.hybridAperture != "") show += 'Aperture: ' + f.hybridAperture + " " + f.hybridApertureUnit + " ";
				if(f.hybridOffset != null && f.hybridOffset != "") show += 'Offset: ' + f.hybridOffset + " " + f.hybridOffsetUnit + " ";
				
				if(f.sealedHealed != null){
					if(f.sealedHealed){
						show += 'Sealed/Healed: Yes;';
					}else{
						show += 'Sealed/Healed: No;';
					}
				}
				
				side += show;
				
				side += '</div>';
			});
		}

		side += addBasicHeaders(outData.fractureInfo);
		side += '</div>';
	}

	//Fault Shear Zone Info
	if(outData.faultsShearZonesInfo != null && outData.faultsShearZonesInfo != ""){
	
		side += '<h3>Faults Shear Zones:</h3>';
		side += '<div>';

		if(outData.faultsShearZonesInfo.faultsShearZones != null && outData.faultsShearZonesInfo.faultsShearZones.length > 0){
			outData.faultsShearZonesInfo.faultsShearZones.forEach((f) => {
				
				side += '<strong>Fault Shear Zone:</strong>';
				side += '<div style="padding-left:25px;">';
				
				let label = '';
				if(f.shearSenses != null && f.shearSenses.length > 0){
					let ssdelim = "";
					f.shearSenses.forEach((ss) => {
						label += ssdelim + ss.type;
						ssdelim = ", ";
					});
					label += "; ";
				}
				
				if(f.indicators != null && f.indicators.length > 0){
					let ssdelim = "";
					f.indicators.forEach((ss) => {
						label += ssdelim + ss.type;
						ssdelim = ", ";
					});
					label += "; ";
				}
				
				if(f.offset != null && f.offset != "") label += "Offset: " + f.offset + " " + f.offsetUnit + " ";
				if(f.width != null && f.width != "") label += "Width: " + f.width + " " + f.widthUnit + " ";
				
				if(label != "") side += label;
				side += '</div>';

			});
		}

		side += addBasicHeaders(outData.faultsShearZonesInfo);
		side += '</div>';
	}

	//Tags Info
	if(outData.tags != null && outData.tags.length > 0){
	
		side += '<h3>Tags:</h3>';
		side += '<div>';
		side += '<ol>';
		
		outData.tags.forEach((tagId) => {
			let foundTag = getTag(tagId);
			if(foundTag != null){
				side += '<li>' + foundTag.name + '</li>';
			}
		});
		
		side += '</ol>';
		side += '</div>';
	}

	//Associated Files Info
	if(outData.associatedFiles != null && outData.associatedFiles.length > 0){
	
		side += '<h3>Associated Files:</h3>';
		side += '<div>';
		side += '<ol>';

		outData.associatedFiles.forEach((af) => {
			side += '<li><a href= "' +smzFilesLocation + projectId + '/associatedFiles/' + af.fileName + '" target="_blank">' + af.fileName + '</a></li>';
		});
		
		side += '</ol>';
		side += '</div>';
	}

	//links Info
	if(outData.links != null && outData.links.length > 0){
	
		side += '<h3>Links:</h3>';
		side += '<div>';
		side += '<ol>';

		outData.links.forEach((link) => {
			side += '<li><a href="' + link.url + '" target="_blank">' + link.label + '</a></li>';
		});
		
		side += '</ol>';
		side += '</div>';
	}

	return side;
}

function getTag(id){
	outTag = null;
	
	if(projectData.tags != null && projectData.tags.length > 0){
		projectData.tags.forEach((t) => {
			if(t.id == id) outTag = t;
		});
	}
	
	return outTag;
}

function showArray(array, label){
	let outString = '';
	let parts = [];
	if(array != null && array.length > 0){
		array.forEach((part) => {
			if(part.type != null && part.type != ""){
				parts.push(part.type);
			}
		});
		
		outString = '<div><strong>' + label + ':</strong> ' + parts.join(", ") + '</div>';
	}
	
	return outString;
}

function fixMicroHeader(header){
	let outName = "";
	microFields.forEach((field) => {
		if(field.rawname == header.toLowerCase()){
			if(field.show == "yes"){
				outName = field.fixedName;
			}
		}
	});
	
	return outName;
}

function addBasicHeaders(json, excludes = []){
	let out = "";
	
	Object.keys(json).forEach((key) => {
		if(!excludes.includes(key)){
			let value = json[key];
			let fixedLabel = fixMicroHeader(key);

			if(fixedLabel != ""){
				if(value != ""){
					out += "<div><strong>" + fixedLabel + ":</strong> " + value + "</div>";
				}
			} 
		}
	});

	return out;
}

function recursiveShowSideMicrograph(micrograph, padding = 0){
	let imageWidth = 200 - padding;
	let sideBar = document.getElementById("leftColumn");
	sideBar.innerHTML += '<div style="padding-left:' + padding + 'px;"><div class="micrographName">' + micrograph.name + '</div><a href="javascript:switchToMicrograph(\'' + micrograph.id + '\')"><img src="' + smzFilesLocation + projectId + '/webThumbnails/' + micrograph.id + '" width="' + imageWidth + 'px"/></a></div>';

	let newPadding = padding + 10;
	
	micrographs.forEach((mg) => {
		if(mg.parentID == micrograph.id){
			recursiveShowSideMicrograph(mg, newPadding);
		}
	});
}

function getMicrograph(inMicrographId){
	let thisMicrograph = null;
	micrographs.forEach((micrograph) => {
		if(micrograph.id == inMicrographId){
			thisMicrograph = micrograph;
		}
	});
	return thisMicrograph;
}

function switchToMicrograph(inMicrographId){
	
	//Get Micrograph
	let thisMicrograph = null;
	micrographs.forEach((micrograph) => {
		if(micrograph.id == inMicrographId){
			thisMicrograph = micrograph;
		}
	});

	if(thisMicrograph != null){

		//Switch Main Image
		switchMainImage(inMicrographId);
		showMicrographDetails(inMicrographId);

	}else{
		clearMainImage();
		document.getElementById("notFoundImage").style.display = "inline";
	}
}

function drawSpots(inMicrograph){

		if(canvas != null){
			let allObjects = canvas.getObjects();

			allObjects.forEach((object) => {
				canvas.remove(object);
			});
		}

		if(inMicrograph.spots != null){
		
			canvas.setHeight(mainImageHeight);
			
			inMicrograph.spots.forEach((spot) => {
				if(spot.geometryType == "point"){
					let xLoc = Math.round(spot.points[0].X * conversionRatio);
					let yLoc = Math.round(spot.points[0].Y * conversionRatio);
					let xTextLoc = xLoc + 15;
					let yTextLoc = yLoc - 15;
					let fillColor = "#" + spot.color.substring(2, 8);
					let labelString = spot.name;
					let spotId = spot.id;

					var circle = new fabric.Circle({
						radius: 7,
						fill: fillColor,
						left: xLoc,
						top: yLoc,
						hoverCursor: "pointer"
					});
		
					circle.set({ strokeWidth: 2, stroke: '#FFFFFF' });
		
					circle.on('mousedown', function() {
						showSpotDetails(spotId);
					});
		
					canvas.add(circle);

					var textLabel = new fabric.Text(labelString, {
						fontFamily: 'Open sans',
						fontSize: 20,
						fill: '#FFFFFF',
						stroke: '#000000',
						strokeWidth: 2,
						left: xTextLoc,
						top: yTextLoc,
						hoverCursor: "pointer",
						paintFirst: "stroke"
					});
		
					textLabel.on('mousedown', function() {
						showSpotDetails(spotId);
					});
		
					canvas.add(textLabel);

				}
				
				if(spot.geometryType == "line"){

					let xVals = [];
					let yVals = [];
					
					let minXVal = 9999;
					let maxXVal = -9999;
					let minYVal = 9999;
					let maxYVal = -9999;
					
					spot.points.forEach((point) => {
						let thisXVal = Math.round(point.X * conversionRatio);
						let thisYVal = Math.round(point.Y * conversionRatio);
						
						if(thisXVal < minXVal) minXVal = thisXVal;
						if(thisXVal > maxXVal) maxXVal = thisXVal;
						if(thisYVal < minYVal) minYVal = thisYVal;
						if(thisYVal > maxYVal) maxYVal = thisYVal;

						
						xVals.push(thisXVal);
						yVals.push(thisYVal);
					});

					centerXVal = Math.round(minXVal + ((maxXVal - minXVal) / 2) + 15);
					centerYVal = Math.round(minYVal + ((maxYVal - minYVal) / 2) - 15);

					let fillColor = "#" + spot.color.substring(2, 8);
					let labelString = spot.name;
					let spotId = spot.id;
					
					for(let coordNum = 0; coordNum < (xVals.length - 1); coordNum++){
					
						let coords = [];
						coords.push(xVals[coordNum]);
						coords.push(yVals[coordNum]);
						coords.push(xVals[coordNum + 1]);
						coords.push(yVals[coordNum + 1]);
						
						var line = new fabric.Line(coords, {
							fill: fillColor,
							stroke: fillColor,
							strokeWidth: 3,
							hoverCursor: "pointer"
						});
		
						line.perPixelTargetFind = true;
						line.targetFindTolerance = 10;


						line.on('mousedown', function() {
							showSpotDetails(spotId);
						});

						canvas.add(line);
					}
					
					var textLabel = new fabric.Text(labelString, {
					  fontFamily: 'Open sans',
					  fontSize: 20,
					  fill: '#FFFFFF',
					  stroke: '#000000',
					  strokeWidth: 2,
					  left: centerXVal,
					  top: centerYVal,
					  hoverCursor: "pointer",
					  paintFirst: "stroke"
					});
	
					textLabel.on('mousedown', function() {
						showSpotDetails(spotId);
					});
	
					canvas.add(textLabel);
					

				}

				if(spot.geometryType == "polygon"){

					let xVals = [];
					let yVals = [];
					
					let minXVal = 9999;
					let maxXVal = -9999;
					let minYVal = 9999;
					let maxYVal = -9999;
					
					spot.points.forEach((point) => {
						let thisXVal = Math.round(point.X * conversionRatio);
						let thisYVal = Math.round(point.Y * conversionRatio);
						
						if(thisXVal < minXVal) minXVal = thisXVal;
						if(thisXVal > maxXVal) maxXVal = thisXVal;
						if(thisYVal < minYVal) minYVal = thisYVal;
						if(thisYVal > maxYVal) maxYVal = thisYVal;

						
						xVals.push(thisXVal);
						yVals.push(thisYVal);
					});

					centerXVal = Math.round(minXVal + ((maxXVal - minXVal) / 2) + 0);
					centerYVal = Math.round(minYVal + ((maxYVal - minYVal) / 2) - 15);

					let fillColor = "#" + spot.color.substring(2, 8);
					let labelString = spot.name;
					let spotId = spot.id;
					
					let coords = [];
					for(let coordNum = 0; coordNum < xVals.length; coordNum++){
						let thisPair = {};
						thisPair.x = xVals[coordNum];
						thisPair.y = yVals[coordNum];
						coords.push(thisPair);
					}
					
					var polygon = new fabric.Polygon(coords, {
						fill: fillColor,
						hoverCursor: "pointer",
						opacity: .7
					});
					
					polygon.on('mousedown', function() {
						showSpotDetails(spotId);
					});
  
					// Render the polygon in canvas
					canvas.add(polygon);

					var textLabel = new fabric.Text(labelString, {
					  fontFamily: 'Open sans',
					  fontSize: 20,
					  fill: '#FFFFFF',
					  stroke: '#000000',
					  strokeWidth: 2,
					  left: centerXVal,
					  top: centerYVal,
					  hoverCursor: "pointer",
					  paintFirst: "stroke"
					});
	
					textLabel.on('mousedown', function() {
						showSpotDetails(spotId);
					});
	
					canvas.add(textLabel);

				}
				
			});
			
		
		}

		let newObjects = canvas.getObjects();

		newObjects.forEach((object) => {
			object.selectable = false
		});

		canvas.renderAll();
		
}

function getMicrographData(inMicrographId){
	var outData = null;
	
	if(projectData.datasets != null){
		projectData.datasets.forEach((dataset) => {
			if(dataset.samples != null){
				dataset.samples.forEach((sample) => {
					if(sample.micrographs != null){
						sample.micrographs.forEach((micrograph) => {
							if(micrograph.id == inMicrographId){
								outData = micrograph;
							}
						});
					}
				});
			}
		});
	}
	
	return outData;
}

function switchMainImage(imageId){
	document.getElementById("notFoundImage").style.display = "none";
	var mainImage = new Image();
	
	mainImage.onload = function () {
		mainImage.width = 750;
		document.getElementById("mainImage").remove();
		mainImage.id = "mainImage";
		document.getElementById("insideWrapper").prepend(mainImage);

		let micrograph = getMicrographData(imageId);
		let naturalWidth = micrograph.width;
		let naturalHeight = micrograph.height;

		let imageRatio = naturalHeight / naturalWidth;
		mainImageHeight = Math.round(750 * imageRatio);
		
		
		
		conversionRatio = 750 / naturalWidth;
		
		console.log("conversionRatio: " + conversionRatio);

		document.getElementById("outsideWrapper").style.height = mainImageHeight + "px";
		document.getElementById("coveringCanvas").style.height = mainImageHeight + "px";

		let thisMicrograph = getMicrograph(imageId);
		drawSpots(thisMicrograph);

	}
	
	mainImage.onerror = function () {
		document.getElementById("notFoundImage").style.display = "inline";
	}
	
	mainImage.src = smzFilesLocation + projectId + "/webImages/" + imageId;
}

function clearMainImage(){
	document.getElementById("mainImage").src = "assets/white.png";
}
