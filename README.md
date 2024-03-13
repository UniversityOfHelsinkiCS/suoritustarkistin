# Suotar - Course Completion Checker

[Suotar](https://opetushallinto.cs.helsinki.fi/suoritustarkistin/) is a tool designed to make registering course completions easy.

Additionally, Suotar automatically checks completions for various mooc-courses every week.

## User's Guide

[Päivittämätön käyttöohje suomeksi](kayttoohje.md)

### Who can use Suotar?

To use Suotar, you must be a HY employee and be approved as a grader in Suotar. To get approved, **first [visit the service](https://opetushallinto.cs.helsinki.fi/suoritustarkistin/)** so that your user account is automatically created, then contact grp-toska@helsinki.fi.

### Supported courses

Suotar can be used to register completions on any course CS department may register. Mostly this means all TKT (also Open University) and some MOOC courses. However, before using Suotar, **the course details must first be added to it manually**. To get your course added, please contact grp-toska@helsinki.fi.

### How to report completions

1. [Visit the site](https://opetushallinto.cs.helsinki.fi/suoritustarkistin/).
2. Request grader approval by mailing grp-toska@helsinki.fi. Also give the details of the course you want to grade.
3. After being approved, head to the service.
4. Select the right course from the dropdown, and paste the list of completions. You can also upload or drag a .csv, .txt, or .dat type file if you prefer. **See format instructions below for details.**
5. Once everything is in order, the green "Send report" button activates, and you can forward the report by clicking it!
6. The CS-department will take care of forwarding the reported completions now to SISU.

In the "View reports" tab you can see all the reports you've sent, as well as their status.

### Format Instructions

Completions are reported as rows, with values separated with a semicolon:

`studentnumber;grade;amount of credits; language`

Only the studentnumber is required, all the other information is filled in from the course details, set date or default grade. If you need to overwrite a default value, you can do so by typing the value in the required row.

Grade can be a number (0, 1, 2, 3, 4, 5), "Hyv." or "Hyl." (Hyv. = hyväksytty = passed, Hyl. = hylätty = failed).

#### Examples of report rows

```
010000003;2;5;fi
011000002;4;;en
011100009;5
011110002;0;;fi
```

On the first row, all details are filled in. The second row has no explicitly set credits. This student will therefore receive the default amount of credits set for this course.

Third row only gives the studentnumber and grade (5), and everything else is filled based on the course details. On the fourth row the completion is marked as failed (grade = 0), and being in Finnish.

Any details and validation errors can be seen in the table below the copy-paste-field.

### Enrolment limbo

In case some students are missing enrolment to the course, Suotar will catch these completions into something called enrolment limbo. Suotar checks automatically every week, whether these students already have enrolled to the course. Once they have, Suotar will create a report of these completions. Teacher does not need to report completions without initial enrolment again.

### Automated reports (for admins only)

There are a bunch courses with automatic reporting. These are courses that come from MOOC and can be found from the page 'Automated Reports'.

### Combo Courses

**Note** *feature is no longer needed since AY codes does not exist anymore. The support can be removed from the code* 

For some courses, same course instance has students signed in from both AY and TKT. These courses are called Combo Courses. When marked as such in the SuotarDB, and approved by Open University, Suotar can automatically detect which completion should the student receive. You can see the selection for each student after inserting the data. The Open University completions will be painted blue.

## Developer Information

### Development Environment

1. Clone the repository
2. Make sure you have a .env-file with the contents of .env.template
3. `npm install`
4. `npm run dev`
5. Open [localhost:8000](localhost:8000)
6. Dev-database can be viewed at: [localhost:8080/?pgsql=db&username=postgres&db=postgres&ns=public](localhost:8080/?pgsql=db&username=postgres&db=postgres&ns=public)

### Production data

Get production data for debugging/development with

```bash
./scripts/get_prod_db.sh
```

### Testing

Run all test by `npm test` or open Cypress interactively with `npm run cypress:open`

### Program Logic

- [Sequence diagram for the EoAI weekly script](documentation/Suotar_Weekly_EoAI_Credit_Markup_Script.png)

See [documentation folder](documentation/) for diagram sources.
