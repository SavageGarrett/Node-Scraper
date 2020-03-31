# File: csvedit.py
# Sanitizes csv files
# CSV files no longer available because had to delete them (see README)

import csv

# Fixes error in a line of the CSV file
def sanitizeDict(dictionary):
	if None in dictionary:
		# Either 
		if len(dictionary[None]) == 1:
			# Look for company name error
			if len(dictionary['Company Domain']) < 7 and dictionary['Company Domain'] != 'null':
				# Shift results over by one
				dictionary['Company Name'] += ' ' + dictionary['Company Domain']
				dictionary['Company Domain'] = dictionary['Linkedin Handle']
				dictionary['Linkedin Handle'] = dictionary['MassChallenge Program']
				dictionary['MassChallenge Program'] = dictionary['Title']
				dictionary['Title'] = dictionary[None][0]
			# Fix multiple title error
			else:
				dictionary['Title'] += ' ' + dictionary[None][0]
		else:
			# Look for company name error
			if len(dictionary['Company Domain']) < 7 and dictionary['Company Domain'] != 'null':
				# Shift results over by one
				dictionary['Company Domain'] = dictionary['Linkedin Handle']
				dictionary['Linkedin Handle'] = dictionary['MassChallenge Program']
				dictionary['MassChallenge Program'] = dictionary['Title']
				dictionary['Title'] = dictionary[None][0]
				dictionary[None][0] = 'nothing'
			# Fix multiple title error
			for title in dictionary[None]:
				if title != 'nothing':
					dictionary['Title'] += " " + title
		return dictionary
	else:
		return 0

def dictToCsvLine(dictionary):
	if dictionary['Company Name'] == 'null' and dictionary['Company Domain'] == 'null':
		return 0
	else:
		csvString = ''
		csvString += dictionary['First Name'] + ','
		csvString += dictionary['Last Name'] + ','
		csvString += dictionary['Email Address'] + ','
		csvString += dictionary['Company Name'] + ','
		csvString += dictionary['Company Domain'] + ','
		csvString += dictionary['Linkedin Handle'] + ','
		csvString += dictionary['MassChallenge Program'] + ','
		csvString += str(dictionary['Title']) + '\n'
		#print(dictionary['Title'])
		return csvString

file = open("final.csv", 'w')
firstLine = 'First Name,Last Name,Email Address,Company Name,Company Domain,Linkedin Handle,MassChallenge Program,Title\n'
file.write(firstLine)
with open('CSV2/merge.csv', mode='r') as csv_file:
	csv_reader = csv.DictReader(csv_file)
	for row in csv_reader:
		sanitized = sanitizeDict(row)
		if sanitized != 0:
			row = sanitized
		line = dictToCsvLine(row)
		#print(line)
		if line != 0:
			file.write(line)
file.close()
